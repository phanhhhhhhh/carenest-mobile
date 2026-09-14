package com.carenest.backend.service;

import com.carenest.backend.entity.FamilyLinkStatus;
import com.carenest.backend.entity.Notification;
import com.carenest.backend.entity.NotificationType;
import com.carenest.backend.entity.User;
import com.carenest.backend.repository.FamilyLinkRepository;
import com.carenest.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class VisitReminderDeliveryService {

    private final FamilyLinkRepository familyLinkRepository;
    private final NotificationRepository notificationRepository;
    private final ApplicationEventPublisher eventPublisher;

    public boolean createDurableReminder(
        Long elderlyId,
        String title,
        String body,
        VisitReminderSubtype subtype
    ) {
        Map<Long, User> recipients = new LinkedHashMap<>();
        familyLinkRepository.findAllFamilyByElderlyIdAndStatus(elderlyId, FamilyLinkStatus.ACTIVE)
            .forEach(link -> recipients.putIfAbsent(link.getFamily().getId(), link.getFamily()));
        if (recipients.isEmpty()) {
            return false;
        }

        Map<String, Object> durableData = Map.of(
            "type", subtype.name(),
            "elderlyId", elderlyId
        );
        recipients.values().forEach(user -> notificationRepository.save(Notification.builder()
            .user(user)
            .type(NotificationType.FAMILY_UPDATE)
            .title(title)
            .body(body)
            .data(durableData)
            .build()));

        List<Long> recipientIds = List.copyOf(recipients.keySet());
        eventPublisher.publishEvent(new VisitReminderPushEvent(
            recipientIds,
            title,
            body,
            Map.of("type", subtype.name(), "elderlyId", elderlyId.toString())
        ));
        return true;
    }
}
