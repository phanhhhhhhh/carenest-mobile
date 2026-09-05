package com.carenest.backend.dto.medication;

import com.carenest.backend.entity.MedicationSchedule;
import jakarta.validation.constraints.NotBlank;
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
public class MedicationRequest {

    @NotNull(message = "elderlyId is required")
    private Long elderlyId;

    @NotBlank(message = "name is required")
    private String name;

    @NotBlank(message = "dosage is required")
    private String dosage;

    private MedicationSchedule schedule;

    private OffsetDateTime nextDoseTime;

    private String instructions;
}