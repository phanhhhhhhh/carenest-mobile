package com.carenest.backend.dto.health;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class MedicationAdherenceReport {
    private Long medicationId;
    private String medicationName;
    private long taken;
    private long missed;
    private long skipped;
    private BigDecimal adherencePercentage;
}
