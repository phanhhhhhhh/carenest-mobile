package com.carenest.backend.dto.admin;

import com.carenest.backend.entity.Appointment;

import java.time.OffsetDateTime;

public record AdminAppointmentResponse(
    Long id,
    Long elderlyId,
    String elderlyName,
    String doctor,
    String specialty,
    String location,
    String status,
    OffsetDateTime datetime
) {
    public static AdminAppointmentResponse from(Appointment a) {
        return new AdminAppointmentResponse(
            a.getId(),
            a.getElderly() != null ? a.getElderly().getId() : null,
            a.getElderly() != null ? a.getElderly().getName() : null,
            a.getDoctor(),
            a.getSpecialty(),
            a.getLocation(),
            a.getStatus() != null ? a.getStatus().name() : null,
            a.getDatetime()
        );
    }
}
