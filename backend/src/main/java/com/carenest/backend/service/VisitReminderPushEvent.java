package com.carenest.backend.service;

import java.util.List;
import java.util.Map;

public record VisitReminderPushEvent(
    List<Long> recipientIds,
    String title,
    String body,
    Map<String, String> data
) {
    public VisitReminderPushEvent {
        recipientIds = List.copyOf(recipientIds);
        data = Map.copyOf(data);
    }
}
