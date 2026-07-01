package com.carenest.backend.dto.medication;

import com.carenest.backend.entity.MedicationLogStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@Builder
public class MedicationLogResponse {

    private Long id;
    private Long medicationId;
    private String medicationName;
    private String dosage;
    private OffsetDateTime takenAt;
    private MedicationLogStatus status;
    private String notes;
    private OffsetDateTime createdAt;
}
