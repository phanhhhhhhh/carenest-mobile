package com.carenest.backend.dto.health;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class AppointmentReportSummary {
    private int total;
    private long scheduled;
    private long completed;
    private long cancelled;
    private long missed;
    private List<AppointmentReportItem> appointments;
}
