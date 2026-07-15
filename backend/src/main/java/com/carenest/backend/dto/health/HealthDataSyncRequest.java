package com.carenest.backend.dto.health;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.time.OffsetDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HealthDataSyncRequest {

    @NotEmpty(message = "dataPoints is required")
    private List<@Valid ExternalDataPoint> dataPoints;

    
    private String source;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExternalDataPoint {

        @NotNull(message = "type is required")
        private String type;

        @NotNull(message = "value is required")
        private java.math.BigDecimal value;

        private java.math.BigDecimal valueSecondary;

        @NotNull(message = "unit is required")
        private String unit;

        @NotNull(message = "recordedAt is required")
        private OffsetDateTime recordedAt;

        private String notes;
    }
}
