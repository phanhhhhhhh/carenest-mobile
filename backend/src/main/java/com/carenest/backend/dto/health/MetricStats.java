package com.carenest.backend.dto.health;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class MetricStats {
    private BigDecimal avgValue;
    private BigDecimal minValue;
    private BigDecimal maxValue;
    private BigDecimal avgSecondary;
    private BigDecimal minSecondary;
    private BigDecimal maxSecondary;
    private int count;
    private String trend; // STABLE, INCREASING, DECREASING, INSUFFICIENT_DATA
}
