package com.carenest.backend.dto.health;

import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@Builder
public class AppointmentReportItem {
    private OffsetDateTime datetime;
    private String doctor;
    private String specialty;
    private String location;
    private String status;
    private String notes;
}
