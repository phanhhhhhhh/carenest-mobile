package com.carenest.backend.dto.health;

import com.carenest.backend.entity.HealthMetricType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Builder
public class HealthMetricResponse {

    private Long id;
    private Long elderlyId;
    private String elderlyName;
    private HealthMetricType type;
    private BigDecimal value;
    private BigDecimal valueSecondary;
    private String unit;
    private OffsetDateTime recordedAt;
    private String notes;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}