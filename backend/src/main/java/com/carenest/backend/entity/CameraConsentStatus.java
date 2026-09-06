package com.carenest.backend.entity;

/** Elderly consent state for camera monitoring (UC D1). */
public enum CameraConsentStatus {
    /** Not yet asked, or a decline retry re-opened the question. */
    PENDING,
    ACCEPTED,
    DECLINED
}
