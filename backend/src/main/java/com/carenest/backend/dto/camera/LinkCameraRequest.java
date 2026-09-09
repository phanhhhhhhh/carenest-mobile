package com.carenest.backend.dto.camera;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record LinkCameraRequest(
    @NotBlank(message = "device serial number is required")
    @Size(max = 64, message = "device serial number must be at most 64 characters")
    @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "device serial number contains invalid characters")
    String deviceSn,

    @NotBlank(message = "room label is required")
    @Size(max = 100, message = "room label must be at most 100 characters")
    String label,

    @Size(max = 128, message = "device verification code must be at most 128 characters")
    String verificationCode
) {
}
