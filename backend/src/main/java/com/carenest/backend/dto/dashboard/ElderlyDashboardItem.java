package com.carenest.backend.dto.dashboard;

import com.carenest.backend.dto.appointment.AppointmentResponse;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Map;

@Getter
@Builder
public class ElderlyDashboardItem {
    private Long elderlyId;
    private String elderlyName;
    private List<String> healthConditions;
    private Map<String, LatestMetricItem> latestMetrics;
    private MedicationAdherenceSummary medicationAdherence;
    private List<AppointmentResponse> upcomingAppointments;
    private ActiveAlertSummary activeAlerts;
    /**
     * UC-22: Color-coded status for multi-elderly dashboard.
     * GREEN = all good, YELLOW = needs attention, RED = critical/emergency.
     */
    @Builder.Default
    private String statusColor = "GREEN";
    private String statusMessage;
}
