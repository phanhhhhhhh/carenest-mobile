package com.carenest.backend.dto.dashboard;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MedicationAdherenceSummary {
    private long totalDue;
    private long taken;
    private long missed;
    private long skipped;
    private double adherenceRate;
}
