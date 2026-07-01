package com.carenest.backend.dto.emergency;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyEventRequest {

    @NotNull(message = "elderlyId is required")
    private Long elderlyId;

    private BigDecimal latitude;

    private BigDecimal longitude;

    private String address;

    private String notes;
}
