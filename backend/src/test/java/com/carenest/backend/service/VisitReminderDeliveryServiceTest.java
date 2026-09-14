package com.carenest.backend.service;

import com.carenest.backend.entity.FamilyLink;
import com.carenest.backend.entity.FamilyLinkStatus;
import com.carenest.backend.entity.Notification;
import com.carenest.backend.entity.NotificationPreferences;
import com.carenest.backend.entity.NotificationType;
import com.carenest.backend.entity.User;
import com.carenest.backend.repository.FamilyLinkRepository;
import com.carenest.backend.repository.NotificationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VisitReminderDeliveryServiceTest {

    @Mock private FamilyLinkRepository familyLinkRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private ApplicationEventPublisher eventPublisher;
    @Captor private ArgumentCaptor<Notification> notificationCaptor;
    @Captor private ArgumentCaptor<VisitReminderPushEvent> eventCaptor;

    @Test
    void activeRecipientsAreDeduplicatedAndPayloadIsStable() {
        User family = User.builder().id(3L).name("Family").build();
        FamilyLink first = FamilyLink.builder().family(family).status(FamilyLinkStatus.ACTIVE).build();
        FamilyLink duplicate = FamilyLink.builder().family(family).status(FamilyLinkStatus.ACTIVE).build();
        when(familyLinkRepository.findAllFamilyByElderlyIdAndStatus(11L, FamilyLinkStatus.ACTIVE))
            .thenReturn(List.of(first, duplicate));
        VisitReminderDeliveryService service = new VisitReminderDeliveryService(
            familyLinkRepository, notificationRepository, eventPublisher, clockAt("2026-09-12T03:00:00Z"));

        assertTrue(service.createDurableReminder(11L, "title", "body",
            VisitReminderSubtype.VISIT_STREAK_REMINDER));

        verify(notificationRepository).save(notificationCaptor.capture());
        Notification saved = notificationCaptor.getValue();
        assertEquals(NotificationType.FAMILY_UPDATE, saved.getType());
        assertEquals(VisitReminderSubtype.VISIT_STREAK_REMINDER.name(), saved.getData().get("type"));
        assertEquals(11L, saved.getData().get("elderlyId"));
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        assertEquals(List.of(3L), eventCaptor.getValue().recipientIds());
        assertEquals("11", eventCaptor.getValue().data().get("elderlyId"));
    }

    @Test
    void noActiveRecipientCreatesNothingAndReturnsFalse() {
        when(familyLinkRepository.findAllFamilyByElderlyIdAndStatus(11L, FamilyLinkStatus.ACTIVE))
            .thenReturn(List.of());
        VisitReminderDeliveryService service = new VisitReminderDeliveryService(
            familyLinkRepository, notificationRepository, eventPublisher, clockAt("2026-09-12T03:00:00Z"));

        assertFalse(service.createDurableReminder(11L, "title", "body",
            VisitReminderSubtype.VISIT_STREAK_REMINDER));

        verifyNoInteractions(notificationRepository, eventPublisher);
        verify(familyLinkRepository).findAllFamilyByElderlyIdAndStatus(11L, FamilyLinkStatus.ACTIVE);
    }

    @Test
    void fcmListenerUsesAfterCommitEventData() {
        FcmService fcmService = org.mockito.Mockito.mock(FcmService.class);
        VisitReminderPushListener listener = new VisitReminderPushListener(fcmService);
        VisitReminderPushEvent event = new VisitReminderPushEvent(
            List.of(3L), "title", "body", java.util.Map.of("type", "VISIT_STREAK_REMINDER"));

        listener.sendAfterCommit(event);

        verify(fcmService).sendToUsers(event.recipientIds(), event.title(), event.body(), event.data());
    }

    @Test
    void optedOutRecipientGetsNeitherDurableNotificationNorPush() {
        User family = User.builder().id(3L).name("Family")
            .notificationPreferences(NotificationPreferences.builder().familyUpdate(false).build())
            .build();
        when(familyLinkRepository.findAllFamilyByElderlyIdAndStatus(11L, FamilyLinkStatus.ACTIVE))
            .thenReturn(List.of(FamilyLink.builder().family(family).status(FamilyLinkStatus.ACTIVE).build()));
        VisitReminderDeliveryService service = new VisitReminderDeliveryService(
            familyLinkRepository, notificationRepository, eventPublisher, clockAt("2026-09-12T03:00:00Z"));

        assertFalse(service.createDurableReminder(11L, "title", "body",
            VisitReminderSubtype.VISIT_STREAK_REMINDER));

        verifyNoInteractions(notificationRepository, eventPublisher);
    }

    @Test
    void quietHoursKeepDurableHistoryButSuppressPush() {
        User family = User.builder().id(3L).name("Family")
            .notificationPreferences(NotificationPreferences.builder()
                .familyUpdate(true).quietHoursStart("22:00").quietHoursEnd("07:00").build())
            .build();
        when(familyLinkRepository.findAllFamilyByElderlyIdAndStatus(11L, FamilyLinkStatus.ACTIVE))
            .thenReturn(List.of(FamilyLink.builder().family(family).status(FamilyLinkStatus.ACTIVE).build()));
        VisitReminderDeliveryService service = new VisitReminderDeliveryService(
            familyLinkRepository, notificationRepository, eventPublisher, clockAt("2026-09-12T16:00:00Z"));

        assertTrue(service.createDurableReminder(11L, "title", "body",
            VisitReminderSubtype.VISIT_STREAK_REMINDER));

        verify(notificationRepository).save(notificationCaptor.capture());
        verify(eventPublisher, never()).publishEvent(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void missingFcmTokenDoesNotPreventDurableCreationForOtherRecipients() {
        User withoutToken = User.builder().id(3L).name("No token").fcmToken(null).build();
        User withToken = User.builder().id(4L).name("Has token").fcmToken("token").build();
        when(familyLinkRepository.findAllFamilyByElderlyIdAndStatus(11L, FamilyLinkStatus.ACTIVE))
            .thenReturn(List.of(
                FamilyLink.builder().family(withoutToken).status(FamilyLinkStatus.ACTIVE).build(),
                FamilyLink.builder().family(withToken).status(FamilyLinkStatus.ACTIVE).build()));
        VisitReminderDeliveryService service = new VisitReminderDeliveryService(
            familyLinkRepository, notificationRepository, eventPublisher, clockAt("2026-09-12T03:00:00Z"));

        assertTrue(service.createDurableReminder(11L, "title", "body",
            VisitReminderSubtype.VISIT_STREAK_REMINDER));

        verify(notificationRepository, times(2)).save(notificationCaptor.capture());
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        assertEquals(List.of(3L, 4L), eventCaptor.getValue().recipientIds());
    }

    private static Clock clockAt(String instant) {
        return Clock.fixed(Instant.parse(instant), VisitStreakCalculator.ICT);
    }
}
