package com.carenest.backend.dto.health;

import com.carenest.backend.entity.HealthMetricType;
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
public class HealthMetricThresholdRequest {

    @NotNull(message = "metricType is required")
    private HealthMetricType metricType;

    private BigDecimal minValue;
    private BigDecimal maxValue;
    private BigDecimal minValueSecondary;
    private BigDecimal maxValueSecondary;

    @Builder.Default
    private Boolean alertFamily = true;
}
