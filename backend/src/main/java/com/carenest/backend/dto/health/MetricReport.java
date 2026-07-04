package com.carenest.backend.dto.health;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class MetricReport {
    private String type;
    private String unit;
    private List<MetricDataPoint> dataPoints;
    private MetricStats stats;
}
