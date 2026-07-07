package com.carenest.backend.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/**
 * Supports two login methods:
 * 1. Email + password (standard auth)
 * 2. Firebase phone token (legacy/existing users)
 */
@Getter
@Setter
public class LoginRequest {

    @Email(message = "Email must be valid")
    private String email;

    @Size(min = 8, max = 100, message = "Password must be 8-100 characters")
    private String password;

    /**
     * Legacy: Firebase ID token from phone OTP login.
     */
    private String firebaseToken;
}
