package com.carenest.backend.dto.camera;

import com.carenest.backend.entity.CameraConsentStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

/** Camera consent state for an elderly profile (UC D1). */
@Getter
@Builder
public class CameraConsentResponse {

    private Long elderlyId;
    private CameraConsentStatus status;
    private OffsetDateTime decidedAt;
    private OffsetDateTime retryAfter;
    private boolean canLinkCamera;
    private String message;
}
