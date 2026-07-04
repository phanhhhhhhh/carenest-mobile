package com.carenest.backend.dto.dashboard;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Builder
public class LatestMetricItem {
    private BigDecimal value;
    private BigDecimal valueSecondary;
    private String unit;
    private OffsetDateTime recordedAt;
}
