package com.carenest.backend.dto.admin;

import com.carenest.backend.entity.Notification;

import java.time.OffsetDateTime;

public record AdminNotificationResponse(
    Long id,
    Long userId,
    String userName,
    String type,
    String title,
    String body,
    boolean read,
    OffsetDateTime createdAt
) {
    public static AdminNotificationResponse from(Notification n) {
        return new AdminNotificationResponse(
            n.getId(),
            n.getUser() != null ? n.getUser().getId() : null,
            n.getUser() != null ? n.getUser().getName() : null,
            n.getType() != null ? n.getType().name() : null,
            n.getTitle(),
            n.getBody(),
            n.getReadAt() != null,
            n.getCreatedAt()
        );
    }
}
