package com.carenest.backend.dto.health;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HealthDataSyncRequest {

    @NotEmpty(message = "dataPoints không được để trống")
    private List<@Valid ExternalDataPoint> dataPoints;

    /** Source of the synced data: GOOGLE_FIT, HEALTH_CONNECT, APPLE_HEALTH, MANUAL */
    private String source;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExternalDataPoint {

        @NotNull(message = "type không được để trống")
        private String type;

        @NotNull(message = "value không được để trống")
        private java.math.BigDecimal value;

        private java.math.BigDecimal valueSecondary;

        @NotNull(message = "unit không được để trống")
        private String unit;

        @NotNull(message = "recordedAt không được để trống")
        private java.time.OffsetDateTime recordedAt;

        private String notes;
    }
}
