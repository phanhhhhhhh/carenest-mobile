package com.carenest.backend.dto.health;

import com.carenest.backend.entity.HealthMetricType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HealthMetricRequest {

    @NotNull(message = "elderlyId is required")
    private Long elderlyId;

    @NotNull(message = "type is required")
    private HealthMetricType type;

    @NotNull(message = "value is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "value must be positive")
    @DecimalMax(value = "99999999.99", message = "value out of range")
    private BigDecimal value;

    @DecimalMin(value = "0.0", inclusive = false, message = "valueSecondary must be positive")
    @DecimalMax(value = "99999999.99", message = "valueSecondary out of range")
    private BigDecimal valueSecondary;

    @NotNull(message = "unit is required")
    private String unit;

    @NotNull(message = "recordedAt is required")
    private OffsetDateTime recordedAt;

    private String notes;
}
