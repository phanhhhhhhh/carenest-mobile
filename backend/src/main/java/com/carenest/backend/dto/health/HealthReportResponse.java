package com.carenest.backend.dto.health;

import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.List;

@Getter
@Builder
public class HealthReportResponse {
    private Long elderlyId;
    private String elderlyName;
    private OffsetDateTime from;
    private OffsetDateTime to;
    private List<MetricReport> reports;
    private List<MedicationAdherenceReport> medicationAdherence;
    private AppointmentReportSummary appointmentSummary;
    private WeeklySummarySnapshot latestWeeklySummary;
}
