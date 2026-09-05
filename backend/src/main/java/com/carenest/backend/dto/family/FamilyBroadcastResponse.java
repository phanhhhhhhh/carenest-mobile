package com.carenest.backend.dto.family;

import com.carenest.backend.entity.BroadcastStatus;
import com.carenest.backend.entity.BroadcastTriggerType;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@Builder
public class FamilyBroadcastResponse {

    private Long id;
    private Long elderlyId;
    private BroadcastTriggerType triggerType;
    private String title;
    private String body;
    private BroadcastStatus status;
    private Long currentRecipientId;
    private OffsetDateTime startedAt;
    private OffsetDateTime acknowledgedAt;
    private Long acknowledgedBy;
    private OffsetDateTime escalatedAt;
}
