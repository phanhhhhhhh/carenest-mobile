package com.carenest.backend.dto.medication;

import com.carenest.backend.entity.MedicationLogStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicationLogRequest {

    @NotNull(message = "medicationId is required")
    private Long medicationId;

    @NotNull(message = "status is required")
    private MedicationLogStatus status;

    private OffsetDateTime takenAt;

    private String notes;
}
