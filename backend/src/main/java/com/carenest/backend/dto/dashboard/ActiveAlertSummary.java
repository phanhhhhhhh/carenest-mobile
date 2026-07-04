package com.carenest.backend.dto.dashboard;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ActiveAlertSummary {
    private int count;
    private String latestTitle;
    private String latestType;
}
