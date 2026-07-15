package com.carenest.backend.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
public class LoginRequest {

    @Email(message = "Email must be valid")
    private String email;

    @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Phone must be 10-15 digits, optionally starting with +")
    private String phone;

    @Size(min = 8, max = 100, message = "Password must be 8-100 characters")
    private String password;

    
    private String firebaseToken;

    
    public boolean hasCredentials() {
        return (email != null && !email.isBlank() && password != null && !password.isBlank())
            || (phone != null && !phone.isBlank() && password != null && !password.isBlank())
            || (firebaseToken != null && !firebaseToken.isBlank());
    }
}
