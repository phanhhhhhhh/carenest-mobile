package com.carenest.backend.dto.dashboard;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class FamilyDashboardResponse {
    private Long familyId;
    private List<ElderlyDashboardItem> elderly;
    private DashboardSummary summary;

    @Getter
    @Builder
    public static class DashboardSummary {
        private int totalElderly;
        private int totalActiveAlerts;
        private int totalUpcomingAppointments;
        private int totalMedicationsDue;
    }
}
