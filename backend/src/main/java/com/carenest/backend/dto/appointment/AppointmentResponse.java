package com.carenest.backend.dto.appointment;

import com.carenest.backend.entity.AppointmentStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@Builder
public class AppointmentResponse {

    private Long id;
    private Long elderlyId;
    private String elderlyName;
    private String doctor;
    private String specialty;
    private String location;
    private OffsetDateTime datetime;
    private String notes;
    private AppointmentStatus status;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
