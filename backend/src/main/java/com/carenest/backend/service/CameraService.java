package com.carenest.backend.service;

import com.carenest.backend.entity.*;
import com.carenest.backend.exception.ConflictException;
import com.carenest.backend.exception.NotFoundException;
import com.carenest.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class CameraService {

    private final CameraDeviceRepository cameraDeviceRepository;
    private final CameraSnapshotRepository cameraSnapshotRepository;
    private final ImouApiService imouApiService;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final FcmService fcmService;
    private final FamilyLinkRepository familyLinkRepository;
    private final CameraConsentService cameraConsentService;

    private static final ZoneId ICT = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    @Transactional
    public CameraDevice bindCamera(Long elderlyId, String deviceSn, String label) {
        User elderly = userRepository.findById(elderlyId)
            .orElseThrow(() -> new NotFoundException("User not found"));

        // UC D1: no camera may be linked without the elderly person's explicit consent.
        cameraConsentService.requireConsent(elderlyId);

        if (cameraDeviceRepository.existsByDeviceSn(deviceSn)) {
            throw new ConflictException("Device " + deviceSn + " is already bound to another account");
        }

        String accessToken = imouApiService.getAccessToken();
        if (accessToken == null) {
            throw new IllegalStateException("Imou API not configured — cannot bind device");
        }

        Map<String, Object> result = imouApiService.bindDevice(deviceSn, accessToken);
        if (result.containsKey("error")) {
            throw new RuntimeException("Failed to bind device: " + result.get("error"));
        }

        Instant boundAt = Instant.now();
        CameraDevice device = CameraDevice.builder()
            .elderly(elderly)
            .label(label)
            .deviceSn(deviceSn)
            .deviceId((String) result.getOrDefault("deviceId", deviceSn))
            .accessToken(accessToken)
            .tokenRefreshedAt(boundAt)
            .status(CameraDevice.CameraStatus.ONLINE)
            .lastSeenAt(boundAt)
            .build();
        device = cameraDeviceRepository.save(device);

        log.info("Camera bound: elderlyId={} deviceSn={} label={}", elderlyId, deviceSn, label);
        return device;
    }

    @Transactional
    public void unbindCamera(Long deviceId) {
        CameraDevice device = cameraDeviceRepository.findById(deviceId)
            .orElseThrow(() -> new NotFoundException("Camera not found"));
        imouApiService.unbindDevice(device.getDeviceSn(), device.getAccessToken());
        cameraDeviceRepository.delete(device);
        log.info("Camera unbound: deviceId={} deviceSn={}", deviceId, device.getDeviceSn());
    }

    public List<CameraDevice> getCamerasForElderly(Long elderlyId) {
        return cameraDeviceRepository.findByElderlyId(elderlyId);
    }

    public Map<String, Object> getLiveStreamUrl(Long deviceId) {
        CameraDevice device = cameraDeviceRepository.findById(deviceId)
            .orElseThrow(() -> new NotFoundException("Camera not found"));

        if (!cameraConsentService.hasConsent(device.getElderly().getId())) {
            return Map.of("status", "CONSENT_REQUIRED",
                "message", "Camera monitoring is turned off — the elderly person has not consented");
        }
        if (device.isPrivacyMode()) {
            return Map.of("status", "PRIVACY",
                "message", "Người thân đang tạm tắt camera để riêng tư");
        }
        if (!device.isOnline()) {
            return Map.of(
                "status", "OFFLINE",
                "message", "Camera is currently unavailable",
                "lastSeenAt", device.getLastSeenAt() != null ? device.getLastSeenAt().toString() : "unknown"
            );
        }

        Map<String, Object> result = imouApiService.getLiveStreamUrl(device.getDeviceSn(), device.getAccessToken());
        return Map.of(
            "status", "ONLINE",
            "streamUrl", result.getOrDefault("url", ""),
            "deviceId", device.getId(),
            "label", device.getLabel()
        );
    }

    @Transactional
    public CameraSnapshot captureSosSnapshot(Long elderlyId, Long emergencyEventId) {
        List<CameraDevice> cameras = cameraDeviceRepository.findByElderlyId(elderlyId);
        if (cameras.isEmpty()) {
            log.debug("No cameras for elderlyId={} — SOS snapshot skipped", elderlyId);
            return null;
        }

        CameraDevice camera = cameras.get(0);

        // UC D4: consent / privacy block the snapshot but MUST NOT block the SOS.
        if (!cameraConsentService.hasConsent(elderlyId) || camera.isPrivacyMode()) {
            CameraSnapshot blocked = CameraSnapshot.builder()
                .camera(camera)
                .elderly(camera.getElderly())
                .trigger(CameraSnapshot.SnapshotTrigger.SOS)
                .emergencyEventId(emergencyEventId)
                .success(false)
                .errorMessage(camera.isPrivacyMode() ? "Privacy mode active" : "Camera consent not given")
                .build();
            return cameraSnapshotRepository.save(blocked);
        }

        if (!camera.isOnline()) {
            CameraSnapshot failed = CameraSnapshot.builder()
                .camera(camera)
                .elderly(camera.getElderly())
                .trigger(CameraSnapshot.SnapshotTrigger.SOS)
                .emergencyEventId(emergencyEventId)
                .success(false)
                .errorMessage("Camera offline")
                .build();
            return cameraSnapshotRepository.save(failed);
        }

        try {
            Map<String, Object> result = imouApiService.captureSnapshot(camera.getDeviceSn(), camera.getAccessToken());
            String imageUrl = (String) result.getOrDefault("url", null);

            CameraSnapshot snapshot = CameraSnapshot.builder()
                .camera(camera)
                .elderly(camera.getElderly())
                .imageUrl(imageUrl)
                .trigger(CameraSnapshot.SnapshotTrigger.SOS)
                .emergencyEventId(emergencyEventId)
                .success(imageUrl != null)
                .errorMessage(imageUrl == null ? "No image URL returned" : null)
                .build();
            snapshot = cameraSnapshotRepository.save(snapshot);
            log.info("SOS snapshot captured: elderlyId={} emergencyEventId={}", elderlyId, emergencyEventId);
            return snapshot;
        } catch (Exception e) {
            log.error("SOS snapshot failed: {}", e.getMessage());
            CameraSnapshot failed = CameraSnapshot.builder()
                .camera(camera)
                .elderly(camera.getElderly())
                .trigger(CameraSnapshot.SnapshotTrigger.SOS)
                .emergencyEventId(emergencyEventId)
                .success(false)
                .errorMessage(e.getMessage())
                .build();
            return cameraSnapshotRepository.save(failed);
        }
    }

    @Transactional
    @Scheduled(fixedRate = 3600000)
    public void scheduledSnapshotCapture() {
        List<CameraDevice> cameras = cameraDeviceRepository.findByStatus(CameraDevice.CameraStatus.ONLINE);

        for (CameraDevice camera : cameras) {
            if (camera.getSnapshotSchedule() == null || camera.getSnapshotSchedule().isBlank()) continue;
            if (camera.isPrivacyMode()) continue;

            String currentTime = ZonedDateTime.now(ICT).format(TIME_FMT);
            List<String> scheduleTimes = Arrays.asList(camera.getSnapshotSchedule().split(","));

            if (scheduleTimes.stream().anyMatch(t -> t.trim().equals(currentTime))) {
                try {
                    captureScheduledSnapshot(camera);
                } catch (Exception e) {
                    log.warn("Scheduled snapshot failed for camera {}: {}", camera.getId(), e.getMessage());
                }
            }
        }
    }

    private void captureScheduledSnapshot(CameraDevice camera) {
        Map<String, Object> result = imouApiService.captureSnapshot(camera.getDeviceSn(), camera.getAccessToken());
        String imageUrl = (String) result.getOrDefault("url", null);

        CameraSnapshot snapshot = CameraSnapshot.builder()
            .camera(camera)
            .elderly(camera.getElderly())
            .imageUrl(imageUrl)
            .trigger(CameraSnapshot.SnapshotTrigger.SCHEDULED)
            .success(imageUrl != null)
            .build();
        cameraSnapshotRepository.save(snapshot);
        log.debug("Scheduled snapshot: cameraId={}", camera.getId());
    }

    public Page<CameraSnapshot> getCheckInTimeline(Long elderlyId, int page, int size) {
        return cameraSnapshotRepository.findByElderlyIdOrderByCreatedAtDesc(elderlyId, PageRequest.of(page, size));
    }

    @Transactional
    public void configureMotionDetection(Long deviceId, boolean enabled, String windowStart, String windowEnd) {
        CameraDevice device = cameraDeviceRepository.findById(deviceId)
            .orElseThrow(() -> new NotFoundException("Camera not found"));
        device.setMotionDetectionEnabled(enabled);
        device.setMonitoringWindowStart(windowStart);
        device.setMonitoringWindowEnd(windowEnd);
        cameraDeviceRepository.save(device);
        log.info("Motion detection configured: cameraId={} enabled={} window={}-{}",
            deviceId, enabled, windowStart, windowEnd);
    }

    @Transactional
    @Scheduled(fixedRate = 300000)
    public void checkMotionDetectionWindows() {
        ZonedDateTime now = ZonedDateTime.now(ICT);
        String currentTime = now.format(TIME_FMT);

        List<CameraDevice> cameras = cameraDeviceRepository.findByStatus(CameraDevice.CameraStatus.ONLINE);
        for (CameraDevice camera : cameras) {
            if (!camera.isMotionDetectionEnabled()) continue;
            if (camera.getMonitoringWindowEnd() == null || camera.getMonitoringWindowStart() == null) continue;

            if (currentTime.equals(camera.getMonitoringWindowEnd())) {
                checkMotionForWindow(camera, now);
            }
        }
    }

    private void checkMotionForWindow(CameraDevice camera, ZonedDateTime now) {
        String endTime = now.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        String startTime = now.minusHours(2).format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

        Map<String, Object> result = imouApiService.getMotionEvents(
            camera.getDeviceSn(), startTime, endTime, camera.getAccessToken());

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> events = (List<Map<String, Object>>) result.getOrDefault("events", List.of());

        if (events.isEmpty()) {
            sendNoMotionAlert(camera);
        } else {
            sendMotionDetectedNotification(camera, events.size());
        }
    }

    private void sendMotionDetectedNotification(CameraDevice camera, int eventCount) {
        String title = "Movement Detected";
        String body = "Movement detected from " + camera.getElderly().getName()
            + "'s " + camera.getLabel() + " during the monitoring window (" + eventCount + " events).";

        List<FamilyLink> links = familyLinkRepository
            .findAllFamilyByElderlyIdAndStatus(camera.getElderly().getId(), FamilyLinkStatus.ACTIVE);

        for (FamilyLink link : links) {
            Notification notif = Notification.builder()
                .user(link.getFamily())
                .type(NotificationType.FAMILY_UPDATE)
                .title(title)
                .body(body)
                .data(Map.of("type", "MOTION_DETECTED", "cameraId", camera.getId().toString(),
                    "eventCount", String.valueOf(eventCount)))
                .build();
            notificationRepository.save(notif);
        }
        log.info("Motion-detected notification: cameraId={} events={}", camera.getId(), eventCount);
    }

    private void sendNoMotionAlert(CameraDevice camera) {
        String title = "No Movement Detected";
        String body = "No movement detected from " + camera.getElderly().getName()
            + "'s " + camera.getLabel() + " during the monitoring window.";

        List<FamilyLink> links = familyLinkRepository
            .findAllFamilyByElderlyIdAndStatus(camera.getElderly().getId(), FamilyLinkStatus.ACTIVE);

        for (FamilyLink link : links) {
            Notification notif = Notification.builder()
                .user(link.getFamily())
                .type(NotificationType.HEALTH_ALERT)
                .title(title)
                .body(body)
                .data(Map.of("type", "NO_MOTION", "cameraId", camera.getId().toString()))
                .build();
            notificationRepository.save(notif);

            fcmService.sendToUser(link.getFamily().getId(), title, body,
                Map.of("type", "NO_MOTION", "elderlyId", camera.getElderly().getId().toString()));
        }
        log.info("No-motion alert sent: cameraId={} elderlyId={}", camera.getId(), camera.getElderly().getId());
    }

    public Map<String, Object> controlPtz(Long deviceId, String direction) {
        CameraDevice device = cameraDeviceRepository.findById(deviceId)
            .orElseThrow(() -> new NotFoundException("Camera not found"));
        if (!device.isOnline()) {
            return Map.of("status", "ERROR", "message", "Camera offline");
        }
        if (device.isPrivacyMode()) {
            return Map.of("status", "ERROR", "message", "Camera is in privacy mode");
        }
        Map<String, Object> allowed = Map.of(
            "LEFT", 1, "RIGHT", 1, "UP", 1, "DOWN", 1, "STOP", 1
        );
        String dir = direction == null ? "" : direction.toUpperCase();
        if (!allowed.containsKey(dir)) {
            return Map.of("status", "ERROR", "message", "Invalid PTZ direction: " + direction);
        }
        Map<String, Object> result = imouApiService.controlPtz(device.getDeviceSn(), dir, device.getAccessToken());
        log.info("PTZ {} requested for cameraId={}", dir, deviceId);
        return Map.of("status", "OK", "direction", dir, "data", result);
    }

    public Map<String, Object> startTwoWayAudio(Long deviceId) {
        CameraDevice device = cameraDeviceRepository.findById(deviceId)
            .orElseThrow(() -> new NotFoundException("Camera not found"));
        if (!cameraConsentService.hasConsent(device.getElderly().getId())) {
            return Map.of("status", "ERROR", "message", "Camera monitoring is not consented to");
        }
        if (device.isPrivacyMode()) {
            return Map.of("status", "ERROR", "message", "Camera is in privacy mode");
        }
        if (!device.isOnline()) {
            return Map.of("status", "ERROR", "message", "Camera offline");
        }
        Map<String, Object> result = imouApiService.startTwoWayAudio(device.getDeviceSn(), device.getAccessToken());
        return Map.of("status", "STARTED", "data", result);
    }

    public Map<String, Object> stopTwoWayAudio(Long deviceId) {
        CameraDevice device = cameraDeviceRepository.findById(deviceId)
            .orElseThrow(() -> new NotFoundException("Camera not found"));
        Map<String, Object> result = imouApiService.stopTwoWayAudio(device.getDeviceSn(), device.getAccessToken());
        return Map.of("status", "STOPPED", "data", result);
    }

    @Transactional
    public Map<String, Object> setPrivacyMode(Long deviceId, boolean enabled) {
        return setPrivacyMode(deviceId, enabled, null);
    }

    /**
     * Temporary Privacy Mode (UC D7). When enabled with {@code hours} (1 or 2) the
     * window auto-expires and {@link #expirePrivacyWindows()} restores monitoring
     * and tells the family. {@code hours == null} keeps the legacy manual toggle.
     */
    @Transactional
    public Map<String, Object> setPrivacyMode(Long deviceId, boolean enabled, Integer hours) {
        CameraDevice device = cameraDeviceRepository.findById(deviceId)
            .orElseThrow(() -> new NotFoundException("Camera not found"));

        imouApiService.setPrivacyMode(device.getDeviceSn(), enabled, device.getAccessToken());
        device.setPrivacyMode(enabled);
        device.setStatus(enabled ? CameraDevice.CameraStatus.PRIVACY : CameraDevice.CameraStatus.ONLINE);

        Instant expiresAt = null;
        if (enabled && hours != null) {
            int clamped = Math.max(1, Math.min(2, hours));
            expiresAt = Instant.now().plus(Duration.ofHours(clamped));
        }
        device.setPrivacyModeExpiresAt(expiresAt);
        cameraDeviceRepository.save(device);

        notifyFamilyPrivacyChange(device, enabled);

        log.info("Privacy mode {} for cameraId={} (expiresAt={})", enabled ? "ON" : "OFF", deviceId, expiresAt);
        return Map.of(
            "status", enabled ? "PRIVACY_ENABLED" : "PRIVACY_DISABLED",
            "expiresAt", expiresAt != null ? expiresAt.toString() : "",
            "message", enabled ? "Camera turned off for privacy" : "Camera streaming resumed"
        );
    }

    /** UC D7: restore monitoring when a temporary Privacy Mode window has passed. */
    @Transactional
    @Scheduled(fixedRate = 60000)
    public void expirePrivacyWindows() {
        Instant now = Instant.now();
        for (CameraDevice camera : cameraDeviceRepository.findByStatus(CameraDevice.CameraStatus.PRIVACY)) {
            if (!camera.isPrivacyMode() || camera.getPrivacyModeExpiresAt() == null) {
                continue;
            }
            if (camera.getPrivacyModeExpiresAt().isAfter(now)) {
                continue;
            }
            try {
                imouApiService.setPrivacyMode(camera.getDeviceSn(), false, camera.getAccessToken());
            } catch (Exception e) {
                log.warn("Imou privacy-off failed on expiry for cameraId={}: {}", camera.getId(), e.getMessage());
            }
            camera.setPrivacyMode(false);
            camera.setPrivacyModeExpiresAt(null);
            camera.setStatus(CameraDevice.CameraStatus.ONLINE);
            cameraDeviceRepository.save(camera);
            notifyFamilyPrivacyChange(camera, false);
            log.info("Privacy Mode window expired — monitoring resumed for cameraId={}", camera.getId());
        }
    }

    private void notifyFamilyPrivacyChange(CameraDevice device, boolean privacyOn) {
        String title = privacyOn ? "Camera Privacy Mode Active" : "Camera Privacy Mode Disabled";
        String body = privacyOn
            ? device.getElderly().getName() + " has temporarily disabled the " + device.getLabel()
                + " camera for privacy."
            : device.getElderly().getName() + " has re-enabled the " + device.getLabel() + " camera.";

        List<FamilyLink> links = familyLinkRepository
            .findAllFamilyByElderlyIdAndStatus(device.getElderly().getId(), FamilyLinkStatus.ACTIVE);
        for (FamilyLink link : links) {
            fcmService.sendToUser(link.getFamily().getId(), title, body,
                Map.of("type", "PRIVACY_CHANGE", "cameraId", device.getId().toString()));
        }
    }

    @Transactional
    @Scheduled(fixedRate = 120000)
    public void pollCameraStatuses() {
        if (!imouApiService.isConfigured()) return;

        List<CameraDevice> cameras = cameraDeviceRepository.findAll();
        for (CameraDevice camera : cameras) {
            try {
                Map<String, Object> status = imouApiService.getDeviceStatus(
                    camera.getDeviceSn(), camera.getAccessToken());
                String deviceStatus = (String) status.getOrDefault("status", "OFFLINE");
                camera.setStatus(mapImouStatus(deviceStatus));
                if ("ONLINE".equalsIgnoreCase(deviceStatus)) {
                    camera.setLastSeenAt(Instant.now());
                }
                cameraDeviceRepository.save(camera);
            } catch (Exception e) {
                log.debug("Status poll failed for camera {}: {}", camera.getId(), e.getMessage());
            }
        }
    }

    public Map<String, Object> getCameraStatus(Long deviceId) {
        CameraDevice camera = cameraDeviceRepository.findById(deviceId)
            .orElseThrow(() -> new NotFoundException("Camera not found"));

        String color;
        String message;
        if (camera.isPrivacyMode()) {
            color = "GRAY";
            message = "Privacy mode active — camera temporarily off";
        } else {
            switch (camera.getStatus()) {
                case ONLINE -> { color = "GREEN"; message = "Camera connected and active"; }
                case OFFLINE -> { color = "RED"; message = "Camera temporarily not connected"; }
                case PRIVACY -> { color = "GRAY"; message = "Privacy mode active"; }
                case ERROR -> { color = "RED"; message = "Camera error — check device"; }
                default -> { color = "RED"; message = "Unknown status"; }
            }
        }

        Map<String, Object> out = new java.util.HashMap<>();
        out.put("deviceId", camera.getId());
        out.put("label", camera.getLabel());
        out.put("status", camera.getStatus().name());
        out.put("indicatorColor", color);
        out.put("message", message);
        out.put("lastSeenAt", camera.getLastSeenAt() != null ? camera.getLastSeenAt().toString() : null);
        out.put("privacyMode", camera.isPrivacyMode());
        out.put("privacyModeExpiresAt",
            camera.getPrivacyModeExpiresAt() != null ? camera.getPrivacyModeExpiresAt().toString() : null);
        return out;
    }

    private CameraDevice.CameraStatus mapImouStatus(String imouStatus) {
        return switch (imouStatus.toUpperCase()) {
            case "ONLINE", "1" -> CameraDevice.CameraStatus.ONLINE;
            case "OFFLINE", "0" -> CameraDevice.CameraStatus.OFFLINE;
            default -> CameraDevice.CameraStatus.ONLINE;
        };
    }

    @Transactional
    @Scheduled(cron = "0 0 3 * * *", zone = "Asia/Ho_Chi_Minh")
    public void cleanupOldSnapshots() {
        Instant cutoff = Instant.now().minus(30, ChronoUnit.DAYS);
        long deleted = cameraSnapshotRepository.deleteByCreatedAtBefore(cutoff);
        log.info("Snapshot cleanup: cutoff={}, deleted={}", cutoff, deleted);
    }
}
