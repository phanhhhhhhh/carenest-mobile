package com.carenest.backend.dto.health;

import com.carenest.backend.entity.HealthMetricType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Builder
public class HealthMetricThresholdResponse {

    private Long id;
    private Long elderlyId;
    private HealthMetricType metricType;
    private BigDecimal minValue;
    private BigDecimal maxValue;
    private BigDecimal minValueSecondary;
    private BigDecimal maxValueSecondary;
    private Boolean alertFamily;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
