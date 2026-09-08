package com.carenest.backend.dto.admin;

import com.carenest.backend.entity.User;

import java.time.OffsetDateTime;

public record AdminUserResponse(
    Long id,
    String name,
    String phone,
    String email,
    String role,
    boolean emailVerified,
    OffsetDateTime createdAt
) {
    public static AdminUserResponse from(User u) {
        return new AdminUserResponse(
            u.getId(),
            u.getName(),
            u.getPhone(),
            u.getEmail(),
            u.getRole().name(),
            u.isEmailVerified(),
            u.getCreatedAt()
        );
    }
}
