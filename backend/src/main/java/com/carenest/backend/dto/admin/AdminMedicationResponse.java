package com.carenest.backend.dto.admin;

import com.carenest.backend.entity.Medication;

import java.time.OffsetDateTime;

public record AdminMedicationResponse(
    Long id,
    Long elderlyId,
    String elderlyName,
    String name,
    String dosage,
    String instructions,
    boolean hasVoiceReminder,
    OffsetDateTime nextDoseTime,
    OffsetDateTime createdAt
) {
    public static AdminMedicationResponse from(Medication m) {
        return new AdminMedicationResponse(
            m.getId(),
            m.getElderly() != null ? m.getElderly().getId() : null,
            m.getElderly() != null ? m.getElderly().getName() : null,
            m.getName(),
            m.getDosage(),
            m.getInstructions(),
            m.getVoiceUrl() != null && !m.getVoiceUrl().isBlank(),
            m.getNextDoseTime(),
            m.getCreatedAt()
        );
    }
}
