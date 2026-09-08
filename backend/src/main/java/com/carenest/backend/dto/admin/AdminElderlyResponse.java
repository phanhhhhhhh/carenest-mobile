package com.carenest.backend.dto.admin;

import com.carenest.backend.entity.ElderlyProfile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public record AdminElderlyResponse(
    Long profileId,
    Long userId,
    String name,
    String phone,
    LocalDate dob,
    List<String> healthConditions,
    String allergies,
    String bloodType,
    BigDecimal weightKg,
    BigDecimal heightCm,
    String cameraConsentStatus,
    OffsetDateTime cameraConsentDecidedAt,
    OffsetDateTime createdAt
) {
    public static AdminElderlyResponse from(ElderlyProfile p) {
        return new AdminElderlyResponse(
            p.getId(),
            p.getUser() != null ? p.getUser().getId() : null,
            p.getUser() != null ? p.getUser().getName() : null,
            p.getUser() != null ? p.getUser().getPhone() : null,
            p.getUser() != null ? p.getUser().getDob() : null,
            p.getHealthConditions(),
            p.getAllergies(),
            p.getBloodType(),
            p.getWeightKg(),
            p.getHeightCm(),
            p.getCameraConsentStatus() != null ? p.getCameraConsentStatus().name() : null,
            p.getCameraConsentDecidedAt(),
            p.getCreatedAt()
        );
    }
}
