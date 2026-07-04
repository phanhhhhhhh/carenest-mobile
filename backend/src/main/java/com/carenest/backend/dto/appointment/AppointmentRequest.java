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

    @NotNull(message = "elderlyId is required")
    private Long elderlyId;

    @NotBlank(message = "doctor is required")
    private String doctor;

    private String specialty;

    @NotBlank(message = "location is required")
    private String location;

    @NotNull(message = "datetime is required")
    private OffsetDateTime datetime;

    private String notes;
}
