package com.carenest.backend.dto.notification;

import com.carenest.backend.entity.NotificationType;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.Map;

@Getter
@Builder
public class NotificationResponse {

    private Long id;
    private Long userId;
    private NotificationType type;
    private String title;
    private String body;
    private Map<String, Object> data;
    private OffsetDateTime readAt;
    private OffsetDateTime createdAt;
}
