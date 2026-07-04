package com.carenest.backend.dto.health;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class HealthDataSyncResponse {
    private int imported;
    private int skipped;
    private int alertsTriggered;
    private List<String> alertMessages;
}
