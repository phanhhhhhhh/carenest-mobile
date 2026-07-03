package com.carenest.backend.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VerifyResetOtpRequest {

    @NotBlank(message = "phone không được để trống")
    private String phone;

    @NotBlank(message = "otpToken không được để trống")
    private String otpToken;
}
