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
import java.util.*;
import java.util.stream.Collectors;

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

    private static final ZoneId ICT = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    @Transactional
    public CameraDevice bindCamera(Long elderlyId, String deviceSn, String label) {
        User elderly = userRepository.findById(elderlyId)
            .orElseThrow(() -> new NotFoundException("User not found"));

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

        CameraDevice device = CameraDevice.builder()
            .elderly(elderly)
            .label(label)
            .deviceSn(deviceSn)
            .deviceId((String) result.getOrDefault("deviceId", deviceSn))
            .accessToken(accessToken)
            .status(CameraDevice.CameraStatus.ONLINE)
            .lastSeenAt(Instant.now())
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
        CameraDevice device = cameraDeviceRepository.findById(deviceId)
            .orElseThrow(() -> new NotFoundException("Camera not found"));

        Map<String, Object> result = imouApiService.setPrivacyMode(device.getDeviceSn(), enabled, device.getAccessToken());
        device.setPrivacyMode(enabled);
        device.setStatus(enabled ? CameraDevice.CameraStatus.PRIVACY : CameraDevice.CameraStatus.ONLINE);
        cameraDeviceRepository.save(device);

        notifyFamilyPrivacyChange(device, enabled);

        log.info("Privacy mode {} for cameraId={}", enabled ? "ON" : "OFF", deviceId);
        return Map.of(
            "status", enabled ? "PRIVACY_ENABLED" : "PRIVACY_DISABLED",
            "message", enabled ? "Camera turned off for privacy" : "Camera streaming resumed"
        );
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

        return Map.of(
            "deviceId", camera.getId(),
            "label", camera.getLabel(),
            "status", camera.getStatus().name(),
            "indicatorColor", color,
            "message", message,
            "lastSeenAt", camera.getLastSeenAt() != null ? camera.getLastSeenAt().toString() : null,
            "privacyMode", camera.isPrivacyMode()
        );
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
        Instant cutoff = Instant.now().minus(30, java.time.temporal.ChronoUnit.DAYS);
        log.debug("Snapshot cleanup: cutoff={}", cutoff);
    }
}
