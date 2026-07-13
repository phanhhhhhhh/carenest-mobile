package com.carenest.backend.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SendOtpRequest {

    @NotBlank(message = "Target (email or phone) is required")
    private String target;

    @NotBlank(message = "Method is required (EMAIL or SMS)")
    private String method; // EMAIL or SMS
}
