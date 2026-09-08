package com.carenest.backend.dto.admin;

import com.carenest.backend.entity.EmergencyEvent;

import java.time.OffsetDateTime;

public record AdminEmergencyResponse(
    Long id,
    Long elderlyId,
    String elderlyName,
    String status,
    int escalationLevel,
    String address,
    OffsetDateTime triggeredAt,
    OffsetDateTime acknowledgedAt,
    Long acknowledgedBy,
    OffsetDateTime escalatedAt,
    OffsetDateTime emergencyCallLoggedAt,
    OffsetDateTime resolvedAt,
    String notes
) {
    public static AdminEmergencyResponse from(EmergencyEvent e) {
        return new AdminEmergencyResponse(
            e.getId(),
            e.getElderly() != null ? e.getElderly().getId() : null,
            e.getElderly() != null ? e.getElderly().getName() : null,
            e.getStatus() != null ? e.getStatus().name() : null,
            e.getEscalationLevel() != null ? e.getEscalationLevel() : 0,
            e.getAddress(),
            e.getTriggeredAt(),
            e.getAcknowledgedAt(),
            e.getAcknowledgedBy(),
            e.getEscalatedAt(),
            e.getEmergencyCallLoggedAt(),
            e.getResolvedAt(),
            e.getNotes()
        );
    }
}
