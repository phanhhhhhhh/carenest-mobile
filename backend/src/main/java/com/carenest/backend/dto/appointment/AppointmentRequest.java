package com.carenest.backend.dto.appointment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentRequest {

    @NotNull(message = "elderlyId không được để trống")
    private Long elderlyId;

    @NotBlank(message = "doctor không được để trống")
    private String doctor;

    private String specialty;

    @NotBlank(message = "location không được để trống")
    private String location;

    @NotNull(message = "datetime không được để trống")
    private OffsetDateTime datetime;

    private String notes;
}
