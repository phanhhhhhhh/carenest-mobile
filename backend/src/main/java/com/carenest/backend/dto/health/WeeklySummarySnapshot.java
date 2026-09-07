package com.carenest.backend.dto.health;

import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@Builder
public class WeeklySummarySnapshot {
    private String title;
    private String body;
    private OffsetDateTime createdAt;
}
