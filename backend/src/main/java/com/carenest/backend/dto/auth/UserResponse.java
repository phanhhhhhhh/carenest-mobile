package com.carenest.backend.dto.auth;

import com.carenest.backend.entity.User;
import com.carenest.backend.entity.UserRole;
import lombok.Getter;

import java.time.LocalDate;

@Getter
public class UserResponse {

    private final Long id;
    private final String name;
    private final String email;
    private final String phone;
    private final UserRole role;
    private final LocalDate dob;
    private final boolean emailVerified;

    public UserResponse(User user) {
        this.id = user.getId();
        this.name = user.getName();
        this.email = user.getEmail();
        this.phone = user.getPhone();
        this.role = user.getRole();
        this.dob = user.getDob();
        this.emailVerified = user.isEmailVerified();
    }
}
