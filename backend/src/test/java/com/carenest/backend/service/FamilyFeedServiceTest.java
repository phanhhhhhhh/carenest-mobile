package com.carenest.backend.service;

import com.carenest.backend.dto.feed.FeedItemResponse;
import com.carenest.backend.dto.feed.FeedReactionResponse;
import com.carenest.backend.entity.CameraSnapshot;
import com.carenest.backend.entity.CheckIn;
import com.carenest.backend.entity.EmergencyEvent;
import com.carenest.backend.entity.FamilyVisit;
import com.carenest.backend.entity.FeedItemType;
import com.carenest.backend.entity.FeedReaction;
import com.carenest.backend.entity.Medication;
import com.carenest.backend.entity.MedicationLog;
import com.carenest.backend.entity.MedicationLogStatus;
import com.carenest.backend.entity.User;
import com.carenest.backend.entity.UserRole;
import com.carenest.backend.repository.CameraSnapshotRepository;
import com.carenest.backend.repository.CheckInRepository;
import com.carenest.backend.repository.EmergencyEventRepository;
import com.carenest.backend.repository.FamilyVisitRepository;
import com.carenest.backend.repository.FeedReactionRepository;
import com.carenest.backend.repository.MedicationLogRepository;
import com.carenest.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FamilyFeedServiceTest {

    @Mock private CheckInRepository checkInRepository;
    @Mock private MedicationLogRepository medicationLogRepository;
    @Mock private EmergencyEventRepository emergencyEventRepository;
    @Mock private FamilyVisitRepository familyVisitRepository;
    @Mock private CameraSnapshotRepository cameraSnapshotRepository;
    @Mock private NotificationBroadcastService notificationBroadcastService;
    @Mock private FeedReactionRepository feedReactionRepository;
    @Mock private UserRepository userRepository;
    @Mock private SubscriptionService subscriptionService;
    @Mock private FcmService fcmService;

    private FamilyFeedService feedService;

    private User elderly;
    private User familyUser;

    @BeforeEach
    void setUp() {
        feedService = new FamilyFeedService(
            checkInRepository,
            medicationLogRepository,
            emergencyEventRepository,
            familyVisitRepository,
            cameraSnapshotRepository,
            notificationBroadcastService,
            feedReactionRepository,
            userRepository,
            subscriptionService,
            fcmService
        );

        elderly = User.builder().id(1L).name("Cụ An").role(UserRole.ELDERLY).build();
        familyUser = User.builder().id(2L).name("Con Bình").role(UserRole.FAMILY).build();
    }

    @Test
    void aggregatesAllFeedItemTypesInChronologicalOrder() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(elderly));
        when(subscriptionService.isPremium(2L)).thenReturn(false);

        OffsetDateTime now = OffsetDateTime.now();

        // 1. Check-in
        CheckIn checkIn = CheckIn.builder()
            .id(101L)
            .elderly(elderly)
            .mood((short) 1)
            .createdAt(now.minusHours(5))
            .build();
        when(checkInRepository.findByElderlyIdAndCreatedAtBetweenOrderByCreatedAtDesc(eq(1L), any(), any()))
            .thenReturn(List.of(checkIn));

        // 2. Medication Log
        Medication med = Medication.builder().name("Amlodipine").dosage("5mg").elderly(elderly).build();
        MedicationLog medLog = MedicationLog.builder()
            .id(102L)
            .medication(med)
            .status(MedicationLogStatus.TAKEN)
            .takenAt(now.minusHours(4))
            .build();
        when(medicationLogRepository.findAllByElderlyIdAndDateRange(eq(1L), any(), any()))
            .thenReturn(List.of(medLog));

        // 3. Emergency Event
        EmergencyEvent emergency = EmergencyEvent.builder()
            .id(103L)
            .elderly(elderly)
            .triggeredAt(now.minusHours(1))
            .acknowledgedAt(now.minusMinutes(30))
            .build();
        when(emergencyEventRepository.findByElderlyIdOrderByTriggeredAtDesc(1L))
            .thenReturn(List.of(emergency));

        // 4. Family Visit
        FamilyVisit visit = FamilyVisit.builder()
            .id(104L)
            .elderly(elderly)
            .member(familyUser)
            .visitedAt(now.minusHours(3))
            .note("Đã mua quà")
            .build();
        when(familyVisitRepository.findInRange(eq(1L), any(), any()))
            .thenReturn(List.of(visit));

        // 5. Camera Snapshot
        CameraSnapshot snapshot = CameraSnapshot.builder()
            .id(105L)
            .elderly(elderly)
            .trigger(CameraSnapshot.SnapshotTrigger.SCHEDULED)
            .success(true)
            .createdAt(Instant.now().minusSeconds(7200))
            .build();
        when(cameraSnapshotRepository.findByElderlyIdAndCreatedAtAfterOrderByCreatedAtDesc(eq(1L), any()))
            .thenReturn(List.of(snapshot));

        when(notificationBroadcastService.acknowledgedTriggerRefs(any(), any(), any()))
            .thenReturn(Set.of());

        List<FeedItemResponse> feed = feedService.getFeed(1L, 2L, 50);

        assertThat(feed).hasSize(5);
        // The newest is Emergency (1 hr ago)
        assertThat(feed.get(0).getType()).isEqualTo(FeedItemType.EMERGENCY);
        assertThat(feed.get(0).getItemRef()).isEqualTo(103L);
        // Next is visit (3 hrs ago) or camera (2 hrs ago)
        assertThat(feed.stream().map(FeedItemResponse::getType))
            .containsExactlyInAnyOrder(
                FeedItemType.EMERGENCY,
                FeedItemType.CAMERA,
                FeedItemType.VISIT,
                FeedItemType.MEDICATION_LOG,
                FeedItemType.CHECK_IN
            );
    }

    @Test
    void toggleReactionSendsWarmFeedbackToElderly() {
        CheckIn checkIn = CheckIn.builder().id(101L).elderly(elderly).build();
        when(checkInRepository.findById(101L)).thenReturn(Optional.of(checkIn));
        when(feedReactionRepository.findByItemTypeAndItemRefAndFamilyUserId(FeedItemType.CHECK_IN, 101L, 2L))
            .thenReturn(Optional.empty());
        when(userRepository.getReferenceById(1L)).thenReturn(elderly);
        when(userRepository.getReferenceById(2L)).thenReturn(familyUser);
        when(userRepository.findById(2L)).thenReturn(Optional.of(familyUser));

        FeedReaction savedReaction = FeedReaction.builder()
            .id(1L)
            .elderly(elderly)
            .familyUser(familyUser)
            .itemType(FeedItemType.CHECK_IN)
            .itemRef(101L)
            .build();
        when(feedReactionRepository.findByElderlyIdAndItemTypeAndItemRefIn(1L, FeedItemType.CHECK_IN, List.of(101L)))
            .thenReturn(List.of(savedReaction));

        FeedReactionResponse response = feedService.toggleReaction(1L, 2L, FeedItemType.CHECK_IN, 101L);

        assertThat(response.isReacted()).isTrue();
        assertThat(response.getReactionCount()).isEqualTo(1);
        verify(fcmService).sendToUser(
            eq(1L),
            eq("Cả nhà đang nghĩ đến ông/bà 💛"),
            eq("Con Bình vừa gửi một trái tim cho ông/bà."),
            any()
        );
    }
}
