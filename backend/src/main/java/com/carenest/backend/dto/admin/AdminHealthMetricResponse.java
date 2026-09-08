package com.carenest.backend.dto.admin;

import com.carenest.backend.entity.HealthMetric;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record AdminHealthMetricResponse(
    Long id,
    Long elderlyId,
    String elderlyName,
    String type,
    BigDecimal value,
    BigDecimal valueSecondary,
    String unit,
    OffsetDateTime recordedAt,
    String notes
) {
    public static AdminHealthMetricResponse from(HealthMetric m) {
        return new AdminHealthMetricResponse(
            m.getId(),
            m.getElderly() != null ? m.getElderly().getId() : null,
            m.getElderly() != null ? m.getElderly().getName() : null,
            m.getType() != null ? m.getType().name() : null,
            m.getValue(),
            m.getValueSecondary(),
            m.getUnit(),
            m.getRecordedAt(),
            m.getNotes()
        );
    }
}
