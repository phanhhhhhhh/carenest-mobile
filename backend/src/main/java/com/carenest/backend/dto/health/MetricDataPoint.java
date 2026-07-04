package com.carenest.backend.dto.health;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Builder
public class MetricDataPoint {
    private OffsetDateTime recordedAt;
    private BigDecimal value;
    private BigDecimal valueSecondary;
    private String notes;
}
