package com.carenest.backend.service;

import com.carenest.backend.entity.AvailabilityStatus;
import com.carenest.backend.entity.BroadcastStatus;
import com.carenest.backend.entity.BroadcastTriggerType;
import com.carenest.backend.entity.FamilyBroadcast;
import com.carenest.backend.entity.FamilyLink;
import com.carenest.backend.entity.FamilyLinkStatus;
import com.carenest.backend.entity.User;
import com.carenest.backend.repository.FamilyBroadcastRepository;
import com.carenest.backend.repository.FamilyLinkRepository;
import com.carenest.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationBroadcastServiceTest {

    @Mock private FamilyBroadcastRepository broadcastRepository;
    @Mock private FamilyLinkRepository familyLinkRepository;
    @Mock private UserRepository userRepository;
    @Mock private FcmService fcmService;
    @Mock private NotificationService notificationService;

    @InjectMocks private NotificationBroadcastService service;

    private static final long ELDERLY_ID = 100L;

    @BeforeEach
    void setUp() {
        org.springframework.test.util.ReflectionTestUtils.setField(service, "escalateTimeoutMinutes", 120L);
        lenient().when(broadcastRepository.save(any(FamilyBroadcast.class))).thenAnswer(inv -> {
            FamilyBroadcast b = inv.getArgument(0);
            if (b.getId() == null) {
                b.setId(9L);
            }
            return b;
        });
        User elderly = User.builder().id(ELDERLY_ID).name("Bà Lan").build();
        lenient().when(userRepository.findById(ELDERLY_ID)).thenReturn(Optional.of(elderly));
    }

    private User user(long id) {
        return User.builder().id(id).name("U" + id).build();
    }

    private FamilyLink link(long familyId, AvailabilityStatus availability, OffsetDateTime lastNotified) {
        return FamilyLink.builder()
            .elderly(user(ELDERLY_ID))
            .family(user(familyId))
            .relationship("Con")
            .status(FamilyLinkStatus.ACTIVE)
            .availabilityStatus(availability)
            .lastNotifiedAt(lastNotified)
            .build();
    }

    @Test
    void startDailyBroadcast_pagesTheOldestNotifiedFreeMemberOnly() {
        FamilyLink busy = link(1L, AvailabilityStatus.BUSY, null);
        FamilyLink freeRecent = link(2L, AvailabilityStatus.FREE, OffsetDateTime.now().minusHours(1));
        FamilyLink freeStale = link(3L, AvailabilityStatus.FREE, OffsetDateTime.now().minusDays(3));
        when(familyLinkRepository.findAllFamilyByElderlyIdAndStatus(ELDERLY_ID, FamilyLinkStatus.ACTIVE))
            .thenReturn(List.of(busy, freeRecent, freeStale));

        FamilyBroadcast b = service.startDailyBroadcast(
            ELDERLY_ID, BroadcastTriggerType.CHECK_IN_UNWELL, 7L, "t", "b");

        assertThat(b.getStatus()).isEqualTo(BroadcastStatus.ACTIVE);
        assertThat(b.getCurrentRecipientId()).isEqualTo(3L); // stale free member first
        assertThat(freeStale.getLastNotifiedAt()).isNotNull();

        ArgumentCaptor<List<Long>> captor = ArgumentCaptor.forClass(List.class);
        verify(fcmService).sendToUsers(captor.capture(), anyString(), anyString(), any());
        assertThat(captor.getValue()).containsExactly(3L);
    }

    @Test
    void startDailyBroadcast_escalatesImmediatelyWhenNobodyIsFree() {
        when(familyLinkRepository.findAllFamilyByElderlyIdAndStatus(ELDERLY_ID, FamilyLinkStatus.ACTIVE))
            .thenReturn(List.of(
                link(1L, AvailabilityStatus.BUSY, null),
                link(2L, AvailabilityStatus.BUSY, null)));

        FamilyBroadcast b = service.startDailyBroadcast(
            ELDERLY_ID, BroadcastTriggerType.CHECK_IN_UNWELL, 7L, "t", "b");

        assertThat(b.getStatus()).isEqualTo(BroadcastStatus.ESCALATED);
        assertThat(b.getEscalatedAt()).isNotNull();
        ArgumentCaptor<List<Long>> captor = ArgumentCaptor.forClass(List.class);
        verify(fcmService).sendToUsers(captor.capture(), anyString(), anyString(), any());
        assertThat(captor.getValue()).containsExactlyInAnyOrder(1L, 2L);
    }

    @Test
    void advanceOrEscalate_movesToNextFreeMemberNotYetPaged() {
        FamilyLink a = link(2L, AvailabilityStatus.FREE, OffsetDateTime.now().minusDays(2));
        FamilyLink bLink = link(3L, AvailabilityStatus.FREE, OffsetDateTime.now().minusDays(1));
        when(familyLinkRepository.findAllFamilyByElderlyIdAndStatus(ELDERLY_ID, FamilyLinkStatus.ACTIVE))
            .thenReturn(List.of(a, bLink));

        FamilyBroadcast broadcast = FamilyBroadcast.builder()
            .id(9L).elderlyId(ELDERLY_ID).triggerType(BroadcastTriggerType.CHECK_IN_UNWELL)
            .title("t").body("b").status(BroadcastStatus.ACTIVE)
            .startedAt(OffsetDateTime.now().minusMinutes(20))
            .currentNotifiedAt(OffsetDateTime.now().minusMinutes(16))
            .currentRecipientId(2L).notifiedUserIds("2")
            .build();

        service.advanceOrEscalate(broadcast);

        assertThat(broadcast.getStatus()).isEqualTo(BroadcastStatus.ACTIVE);
        assertThat(broadcast.getCurrentRecipientId()).isEqualTo(3L);
        assertThat(broadcast.getNotifiedUserIds()).contains("2").contains("3");
    }

    @Test
    void advanceOrEscalate_escalatesWhenFreeListExhausted() {
        FamilyLink only = link(2L, AvailabilityStatus.FREE, OffsetDateTime.now().minusDays(2));
        when(familyLinkRepository.findAllFamilyByElderlyIdAndStatus(ELDERLY_ID, FamilyLinkStatus.ACTIVE))
            .thenReturn(List.of(only));

        FamilyBroadcast broadcast = FamilyBroadcast.builder()
            .id(9L).elderlyId(ELDERLY_ID).triggerType(BroadcastTriggerType.CHECK_IN_UNWELL)
            .title("t").body("b").status(BroadcastStatus.ACTIVE)
            .startedAt(OffsetDateTime.now().minusMinutes(20))
            .currentNotifiedAt(OffsetDateTime.now().minusMinutes(16))
            .currentRecipientId(2L).notifiedUserIds("2")
            .build();

        service.advanceOrEscalate(broadcast);

        assertThat(broadcast.getStatus()).isEqualTo(BroadcastStatus.ESCALATED);
    }

    @Test
    void advanceOrEscalate_escalatesAfterTwoHoursEvenWithFreeMembersLeft() {
        FamilyLink fresh = link(3L, AvailabilityStatus.FREE, null);
        when(familyLinkRepository.findAllFamilyByElderlyIdAndStatus(ELDERLY_ID, FamilyLinkStatus.ACTIVE))
            .thenReturn(List.of(fresh));

        FamilyBroadcast broadcast = FamilyBroadcast.builder()
            .id(9L).elderlyId(ELDERLY_ID).triggerType(BroadcastTriggerType.CHECK_IN_UNWELL)
            .title("t").body("b").status(BroadcastStatus.ACTIVE)
            .startedAt(OffsetDateTime.now().minusMinutes(130))
            .currentNotifiedAt(OffsetDateTime.now().minusMinutes(16))
            .currentRecipientId(2L).notifiedUserIds("2")
            .build();

        service.advanceOrEscalate(broadcast);

        assertThat(broadcast.getStatus()).isEqualTo(BroadcastStatus.ESCALATED);
    }

    @Test
    void acknowledge_stopsTheSequenceAndStampsTheLink() {
        FamilyLink link = link(2L, AvailabilityStatus.FREE, OffsetDateTime.now());
        FamilyBroadcast broadcast = FamilyBroadcast.builder()
            .id(9L).elderlyId(ELDERLY_ID).triggerType(BroadcastTriggerType.CHECK_IN_UNWELL)
            .title("t").body("b").status(BroadcastStatus.ACTIVE)
            .startedAt(OffsetDateTime.now().minusMinutes(5))
            .build();
        when(broadcastRepository.findById(9L)).thenReturn(Optional.of(broadcast));
        when(familyLinkRepository.findByElderlyIdAndFamilyIdAndDeletedAtIsNull(ELDERLY_ID, 2L))
            .thenReturn(Optional.of(link));

        service.acknowledge(9L, 2L);

        assertThat(broadcast.getStatus()).isEqualTo(BroadcastStatus.ACKNOWLEDGED);
        assertThat(broadcast.getAcknowledgedBy()).isEqualTo(2L);
        assertThat(link.getLastAckAt()).isNotNull();
        verify(fcmService, never()).sendToUsers(anyList(), anyString(), anyString(), any());
        verify(notificationService, never()).createForUsers(anyList(), any(), anyString(), anyString(), any());
    }

    @Test
    void acknowledge_isIdempotent() {
        FamilyBroadcast broadcast = FamilyBroadcast.builder()
            .id(9L).elderlyId(ELDERLY_ID).triggerType(BroadcastTriggerType.CHECK_IN_UNWELL)
            .title("t").body("b").status(BroadcastStatus.ACKNOWLEDGED)
            .acknowledgedBy(5L)
            .build();
        when(broadcastRepository.findById(9L)).thenReturn(Optional.of(broadcast));

        service.acknowledge(9L, 2L);

        assertThat(broadcast.getAcknowledgedBy()).isEqualTo(5L); // unchanged
    }

    @Test
    void startDailyBroadcast_alsoWritesAnInAppNotificationRow() {
        when(familyLinkRepository.findAllFamilyByElderlyIdAndStatus(ELDERLY_ID, FamilyLinkStatus.ACTIVE))
            .thenReturn(List.of(link(2L, AvailabilityStatus.FREE, null)));

        service.startDailyBroadcast(ELDERLY_ID, BroadcastTriggerType.CHECK_IN_UNWELL, 7L, "t", "b");

        verify(notificationService).createForUsers(eq(List.of(2L)), any(), anyString(), anyString(), any());
    }
}
