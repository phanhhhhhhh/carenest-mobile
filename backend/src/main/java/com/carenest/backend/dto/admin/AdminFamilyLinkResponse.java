package com.carenest.backend.dto.admin;

import com.carenest.backend.entity.FamilyLink;

import java.time.OffsetDateTime;

public record AdminFamilyLinkResponse(
    Long id,
    Long elderlyId,
    String elderlyName,
    Long familyId,
    String familyName,
    String familyPhone,
    String relationship,
    String status,
    String availabilityStatus,
    OffsetDateTime lastAckAt,
    OffsetDateTime createdAt
) {
    public static AdminFamilyLinkResponse from(FamilyLink fl) {
        return new AdminFamilyLinkResponse(
            fl.getId(),
            fl.getElderly() != null ? fl.getElderly().getId() : null,
            fl.getElderly() != null ? fl.getElderly().getName() : null,
            fl.getFamily() != null ? fl.getFamily().getId() : null,
            fl.getFamily() != null ? fl.getFamily().getName() : null,
            fl.getFamily() != null ? fl.getFamily().getPhone() : null,
            fl.getRelationship(),
            fl.getStatus() != null ? fl.getStatus().name() : null,
            fl.getAvailabilityStatus() != null ? fl.getAvailabilityStatus().name() : null,
            fl.getLastAckAt(),
            fl.getCreatedAt()
        );
    }
}
