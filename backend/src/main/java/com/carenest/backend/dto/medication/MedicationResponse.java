package com.carenest.backend.dto.medication;

import com.carenest.backend.entity.MedicationSchedule;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@Builder
public class MedicationResponse {

    private Long id;
    private Long elderlyId;
    private String elderlyName;
    private String name;
    private String dosage;
    private MedicationSchedule schedule;
    private OffsetDateTime nextDoseTime;
    private String instructions;
    private String voiceUrl;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}