package com.carenest.backend.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VerifyResetOtpRequest {

    @NotBlank(message = "phone is required")
    private String phone;

    @NotBlank(message = "otpToken is required")
    private String otpToken;
}
