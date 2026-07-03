package com.carenest.backend.dto.reminder;

import com.carenest.backend.entity.RepeatRule;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@Builder
public class ReminderResponse {

    private Long id;
    private Long elderlyId;
    private String elderlyName;
    private Long createdById;
    private String createdByName;
    private String title;
    private OffsetDateTime remindAt;
    private RepeatRule repeatRule;
    private Boolean isActive;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
