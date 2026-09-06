package com.carenest.backend.service;

import com.carenest.backend.dto.camera.CameraConsentResponse;
import com.carenest.backend.entity.CameraConsentStatus;
import com.carenest.backend.entity.CameraDevice;
import com.carenest.backend.entity.ElderlyProfile;
import com.carenest.backend.entity.FamilyLinkStatus;
import com.carenest.backend.entity.NotificationType;
import com.carenest.backend.exception.ConflictException;
import com.carenest.backend.exception.NotFoundException;
import com.carenest.backend.repository.CameraDeviceRepository;
import com.carenest.backend.repository.ElderlyProfileRepository;
import com.carenest.backend.repository.FamilyLinkRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Camera Consent Onboarding (UC D1). The elderly person must explicitly accept
 * camera monitoring before any camera can be linked or used. Declining turns
 * every camera fully off and schedules exactly ONE re-ask 30 days later;
 * Check-in, Feed, Visit Streak, medication and SOS keep working regardless.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CameraConsentService {

    private static final int RETRY_DAYS = 30;

    private final ElderlyProfileRepository elderlyProfileRepository;
    private final CameraDeviceRepository cameraDeviceRepository;
    private final FamilyLinkRepository familyLinkRepository;
    private final FcmService fcmService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public CameraConsentResponse getStatus(Long elderlyId) {
        ElderlyProfile profile = requireProfile(elderlyId);
        return toResponse(elderlyId, profile);
    }

    @Transactional
    public CameraConsentResponse decide(Long elderlyId, boolean accepted) {
        ElderlyProfile profile = requireProfile(elderlyId);
        OffsetDateTime now = OffsetDateTime.now();
        profile.setCameraConsentDecidedAt(now);

        if (accepted) {
            profile.setCameraConsentStatus(CameraConsentStatus.ACCEPTED);
            profile.setCameraConsentRetryAfter(null);
            log.info("Camera consent ACCEPTED for elderlyId={}", elderlyId);
        } else {
            profile.setCameraConsentStatus(CameraConsentStatus.DECLINED);
            profile.setCameraConsentRetryAfter(now.plusDays(RETRY_DAYS));
            turnCamerasOff(elderlyId);
            log.info("Camera consent DECLINED for elderlyId={} — cameras off, re-ask after {}",
                elderlyId, profile.getCameraConsentRetryAfter());
        }
        elderlyProfileRepository.save(profile);
        return toResponse(elderlyId, profile);
    }

    /** Guard used by {@link CameraService} before any camera operation. */
    public void requireConsent(Long elderlyId) {
        ElderlyProfile profile = elderlyProfileRepository.findByUserIdAndDeletedAtIsNull(elderlyId).orElse(null);
        if (profile == null || profile.getCameraConsentStatus() != CameraConsentStatus.ACCEPTED) {
            throw new ConflictException(
                "Camera monitoring has not been consented to for this elderly profile (UC D1)");
        }
    }

    public boolean hasConsent(Long elderlyId) {
        return elderlyProfileRepository.findByUserIdAndDeletedAtIsNull(elderlyId)
            .map(p -> p.getCameraConsentStatus() == CameraConsentStatus.ACCEPTED)
            .orElse(false);
    }

    /** Daily scheduler hook: fire the single 30-day re-ask for declined profiles. */
    @Transactional
    public int runConsentRetries() {
        List<ElderlyProfile> due = elderlyProfileRepository
            .findByCameraConsentStatusAndCameraConsentRetryAfterLessThanEqualAndDeletedAtIsNull(
                CameraConsentStatus.DECLINED, OffsetDateTime.now());
        int count = 0;
        for (ElderlyProfile profile : due) {
            Long elderlyId = profile.getUser().getId();
            // Re-open the question and clear the retry so it only ever fires once.
            profile.setCameraConsentStatus(CameraConsentStatus.PENDING);
            profile.setCameraConsentRetryAfter(null);
            elderlyProfileRepository.save(profile);

            notifyConsentReask(elderlyId);
            count++;
        }
        if (count > 0) {
            log.info("Camera consent re-ask sent for {} profiles", count);
        }
        return count;
    }

    // --- helpers -----------------------------------------------------------

    private ElderlyProfile requireProfile(Long elderlyId) {
        return elderlyProfileRepository.findByUserIdAndDeletedAtIsNull(elderlyId)
            .orElseThrow(() -> new NotFoundException("Elderly profile not found for user: " + elderlyId));
    }

    private void turnCamerasOff(Long elderlyId) {
        List<CameraDevice> cameras = cameraDeviceRepository.findByElderlyId(elderlyId);
        for (CameraDevice camera : cameras) {
            camera.setPrivacyMode(true);
            camera.setPrivacyModeExpiresAt(null);
            camera.setStatus(CameraDevice.CameraStatus.PRIVACY);
            cameraDeviceRepository.save(camera);
        }
    }

    private void notifyConsentReask(Long elderlyId) {
        List<Long> recipients = familyLinkRepository
            .findAllFamilyByElderlyIdAndStatus(elderlyId, FamilyLinkStatus.ACTIVE)
            .stream()
            .map(fl -> fl.getFamily().getId())
            .collect(Collectors.toList());
        recipients.add(elderlyId);

        String title = "Xem lại việc dùng camera an sinh";
        String body = "Đã 30 ngày kể từ lần trước. Ông/bà có muốn cân nhắc lại việc bật camera an sinh không? "
            + "Bạn có thể chọn lại bất cứ lúc nào.";
        fcmService.sendToUsers(recipients, title, body,
            Map.of("type", "CAMERA_CONSENT_REASK", "elderlyId", elderlyId.toString()));
        notificationService.createForUsers(recipients, NotificationType.FAMILY_UPDATE, title, body,
            Map.of("type", "CAMERA_CONSENT_REASK", "elderlyId", elderlyId));
    }

    private CameraConsentResponse toResponse(Long elderlyId, ElderlyProfile profile) {
        boolean canLink = profile.getCameraConsentStatus() == CameraConsentStatus.ACCEPTED;
        String message = switch (profile.getCameraConsentStatus()) {
            case ACCEPTED -> "Đã đồng ý dùng camera an sinh.";
            case DECLINED -> "Đã từ chối camera. Các tính năng khác vẫn hoạt động bình thường.";
            case PENDING -> "Chưa quyết định về việc dùng camera an sinh.";
        };
        return CameraConsentResponse.builder()
            .elderlyId(elderlyId)
            .status(profile.getCameraConsentStatus())
            .decidedAt(profile.getCameraConsentDecidedAt())
            .retryAfter(profile.getCameraConsentRetryAfter())
            .canLinkCamera(canLink)
            .message(message)
            .build();
    }
}
