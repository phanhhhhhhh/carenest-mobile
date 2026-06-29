package com.carenest.backend.dto.auth;

import com.carenest.backend.entity.UserRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class RegisterRequest {

    @NotBlank
    private String firebaseToken;

    @NotBlank
    private String name;

    @NotNull
    private UserRole role;

    private LocalDate dob;
}