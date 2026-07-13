package com.carenest.backend.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VerifyOtpRequest {

    @NotBlank(message = "Target (email or phone) is required")
    private String target;

    @NotBlank(message = "OTP code is required")
    private String code;
}
