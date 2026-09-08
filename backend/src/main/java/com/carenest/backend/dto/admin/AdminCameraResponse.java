package com.carenest.backend.dto.admin;

import com.carenest.backend.entity.CameraDevice;

import java.time.Instant;

public record AdminCameraResponse(
    Long id,
    Long elderlyId,
    String elderlyName,
    String label,
    String deviceSn,
    String status,
    boolean privacyMode,
    Instant privacyModeExpiresAt,
    boolean motionDetectionEnabled,
    Instant lastSeenAt,
    Instant createdAt
) {
    public static AdminCameraResponse from(CameraDevice d) {
        return new AdminCameraResponse(
            d.getId(),
            d.getElderly() != null ? d.getElderly().getId() : null,
            d.getElderly() != null ? d.getElderly().getName() : null,
            d.getLabel(),
            d.getDeviceSn(),
            d.getStatus() != null ? d.getStatus().name() : null,
            d.isPrivacyMode(),
            d.getPrivacyModeExpiresAt(),
            d.isMotionDetectionEnabled(),
            d.getLastSeenAt(),
            d.getCreatedAt()
        );
    }
}
