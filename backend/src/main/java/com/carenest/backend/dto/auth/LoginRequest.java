package com.carenest.backend.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/**
 * Supports three login methods:
 * 1. Email + password (standard)
 * 2. Phone + password (no email required)
 * 3. Firebase phone OTP token (legacy)
 *
 * Priority: phone > email > firebaseToken
 */
@Getter
@Setter
public class LoginRequest {

    @Email(message = "Email must be valid")
    private String email;

    @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Phone must be 10-15 digits, optionally starting with +")
    private String phone;

    @Size(min = 8, max = 100, message = "Password must be 8-100 characters")
    private String password;

    /**
     * Legacy: Firebase ID token from phone OTP login.
     */
    private String firebaseToken;

    /**
     * At least one credential must be provided.
     */
    public boolean hasCredentials() {
        return (email != null && !email.isBlank() && password != null && !password.isBlank())
            || (phone != null && !phone.isBlank() && password != null && !password.isBlank())
            || (firebaseToken != null && !firebaseToken.isBlank());
    }
}
