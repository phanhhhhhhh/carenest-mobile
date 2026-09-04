package com.carenest.backend.service;

import com.carenest.backend.dto.emergency.EmergencyEventRequest;
import com.carenest.backend.dto.emergency.EmergencyEventResponse;
import com.carenest.backend.entity.ElderlyProfile;
import com.carenest.backend.entity.EmergencyEvent;
import com.carenest.backend.entity.EmergencyStatus;
import com.carenest.backend.entity.FamilyLink;
import com.carenest.backend.entity.FamilyLinkStatus;
import com.carenest.backend.entity.NotificationType;
import com.carenest.backend.entity.User;
import com.carenest.backend.entity.UserRole;
import com.carenest.backend.repository.ElderlyProfileRepository;
import com.carenest.backend.repository.EmergencyEventRepository;
import com.carenest.backend.repository.FamilyLinkRepository;
import com.carenest.backend.repository.UserRepository;
import com.carenest.backend.scheduler.EmergencyEscalationScheduler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmergencyEscalationServiceTest {

    @Mock private EmergencyEventRepository emergencyEventRepository;
    @Mock private UserRepository userRepository;
    @Mock private FamilyLinkRepository familyLinkRepository;
    @Mock private ElderlyProfileRepository elderlyProfileRepository;
    @Mock private NotificationService notificationService;
    @Mock private FcmService fcmService;
    @Mock private CameraService cameraService;

    @InjectMocks
    private EmergencyEventService emergencyEventService;

    private User elderlyUser;
    private User familyUser;
    private User secondaryFamilyUser;
    private FamilyLink familyLink;

    @BeforeEach
    void setUp() {
        elderlyUser = User.builder().id(10L).name("Cụ An").role(UserRole.ELDERLY).build();
        familyUser = User.builder().id(20L).name("Con trai Bình").role(UserRole.FAMILY).build();
        secondaryFamilyUser = User.builder().id(30L).name("Con gái Chi").role(UserRole.FAMILY).build();

        familyLink = FamilyLink.builder()
            .id(100L)
            .elderly(elderlyUser)
            .family(familyUser)
            .relationship("Son")
            .status(FamilyLinkStatus.ACTIVE)
            .build();
    }

    @Test
    void testTrigger_createsEventAndNotifiesFamilyWithInApp() {
        EmergencyEventRequest request = EmergencyEventRequest.builder()
            .elderlyId(10L)
            .type("SOS")
            .description("Bấm nút SOS")
            .build();

        when(userRepository.findById(10L)).thenReturn(Optional.of(elderlyUser));
        when(familyLinkRepository.findAllFamilyByElderlyIdAndStatus(10L, FamilyLinkStatus.ACTIVE))
            .thenReturn(List.of(familyLink));
        when(emergencyEventRepository.save(any(EmergencyEvent.class))).thenAnswer(invocation -> {
            EmergencyEvent ev = invocation.getArgument(0);
            ev.setId(1L);
            return ev;
        });

        EmergencyEventResponse response = emergencyEventService.trigger(request);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals(EmergencyStatus.ACTIVE, response.getStatus());
        assertEquals(0, response.getEscalationLevel());

        verify(fcmService).sendToUsers(eq(List.of(20L)), anyString(), anyString(), anyMap());
        verify(notificationService).createForUsers(eq(List.of(20L)), eq(NotificationType.EMERGENCY), anyString(), anyString(), anyMap());
    }

    @Test
    void testEscalateLevel1_withSecondaryContact_notifiesBoth( ) {
        // AC1 & AC2
        EmergencyEvent event = EmergencyEvent.builder()
            .id(1L)
            .elderly(elderlyUser)
            .status(EmergencyStatus.ACTIVE)
            .escalationLevel(0)
            .triggeredAt(OffsetDateTime.now().minusMinutes(4))
            .build();

        ElderlyProfile profile = ElderlyProfile.builder()
            .id(5L)
            .user(elderlyUser)
            .secondaryFamilyUser(secondaryFamilyUser)
            .build();

        when(emergencyEventRepository.findById(1L)).thenReturn(Optional.of(event));
        when(familyLinkRepository.findAllFamilyByElderlyIdAndStatus(10L, FamilyLinkStatus.ACTIVE))
            .thenReturn(List.of(familyLink));
        when(elderlyProfileRepository.findByUserIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(profile));
        when(emergencyEventRepository.save(any(EmergencyEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        emergencyEventService.escalate(1L, 1);

        assertEquals(1, event.getEscalationLevel());
        assertNotNull(event.getEscalatedAt());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Long>> recipientsCaptor = ArgumentCaptor.forClass(List.class);
        verify(fcmService).sendToUsers(recipientsCaptor.capture(), anyString(), anyString(), anyMap());

        List<Long> recipients = recipientsCaptor.getValue();
        assertTrue(recipients.contains(20L));
        assertTrue(recipients.contains(30L)); // AC2: secondary contact included!
    }

    @Test
    void testEscalateLevel1_withoutSecondaryContact_notifiesPrimaryOnly() {
        // AC3
        EmergencyEvent event = EmergencyEvent.builder()
            .id(2L)
            .elderly(elderlyUser)
            .status(EmergencyStatus.ACTIVE)
            .escalationLevel(0)
            .triggeredAt(OffsetDateTime.now().minusMinutes(4))
            .build();

        ElderlyProfile profile = ElderlyProfile.builder()
            .id(6L)
            .user(elderlyUser)
            .secondaryFamilyUser(null)
            .build();

        when(emergencyEventRepository.findById(2L)).thenReturn(Optional.of(event));
        when(familyLinkRepository.findAllFamilyByElderlyIdAndStatus(10L, FamilyLinkStatus.ACTIVE))
            .thenReturn(List.of(familyLink));
        when(elderlyProfileRepository.findByUserIdAndDeletedAtIsNull(10L)).thenReturn(Optional.of(profile));
        when(emergencyEventRepository.save(any(EmergencyEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        emergencyEventService.escalate(2L, 1);

        assertEquals(1, event.getEscalationLevel());
        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Long>> recipientsCaptor = ArgumentCaptor.forClass(List.class);
        verify(fcmService).sendToUsers(recipientsCaptor.capture(), anyString(), anyString(), anyMap());

        List<Long> recipients = recipientsCaptor.getValue();
        assertEquals(List.of(20L), recipients);
    }

    @Test
    void testEscalateLevel2_updatesLevel2AndUrgentBannerPayload() {
        // AC4
        EmergencyEvent event = EmergencyEvent.builder()
            .id(3L)
            .elderly(elderlyUser)
            .status(EmergencyStatus.ACTIVE)
            .escalationLevel(1)
            .triggeredAt(OffsetDateTime.now().minusMinutes(11))
            .build();

        when(emergencyEventRepository.findById(3L)).thenReturn(Optional.of(event));
        when(familyLinkRepository.findAllFamilyByElderlyIdAndStatus(10L, FamilyLinkStatus.ACTIVE))
            .thenReturn(List.of(familyLink));
        when(elderlyProfileRepository.findByUserIdAndDeletedAtIsNull(10L)).thenReturn(Optional.empty());
        when(emergencyEventRepository.save(any(EmergencyEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        emergencyEventService.escalate(3L, 2);

        assertEquals(2, event.getEscalationLevel());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, String>> dataCaptor = ArgumentCaptor.forClass(Map.class);
        verify(fcmService).sendToUsers(anyList(), anyString(), anyString(), dataCaptor.capture());
        assertEquals("SOS_ESCALATION_LEVEL_2", dataCaptor.getValue().get("type"));
        assertEquals("2", dataCaptor.getValue().get("escalationLevel"));
    }

    @Test
    void testAcknowledge_stopsEscalation() {
        // AC5
        EmergencyEvent event = EmergencyEvent.builder()
            .id(4L)
            .elderly(elderlyUser)
            .status(EmergencyStatus.ACTIVE)
            .escalationLevel(1)
            .build();

        when(emergencyEventRepository.findById(4L)).thenReturn(Optional.of(event));
        when(userRepository.findById(20L)).thenReturn(Optional.of(familyUser));
        when(emergencyEventRepository.save(any(EmergencyEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        EmergencyEventResponse resp = emergencyEventService.acknowledge(4L, 20L);

        assertEquals(EmergencyStatus.RESOLVED, resp.getStatus());
        assertNotNull(resp.getAcknowledgedAt());
        assertEquals(20L, resp.getAcknowledgedBy());

        // Now if escalate is called on this resolved event, it does nothing
        reset(fcmService, notificationService);
        emergencyEventService.escalate(4L, 2);
        verifyNoInteractions(fcmService, notificationService);
    }

    @Test
    void testCancel_byElderly_cancelsSosAndNotifiesFamily() {
        // AC6
        EmergencyEvent event = EmergencyEvent.builder()
            .id(5L)
            .elderly(elderlyUser)
            .status(EmergencyStatus.ACTIVE)
            .escalationLevel(1)
            .build();

        when(emergencyEventRepository.findById(5L)).thenReturn(Optional.of(event));
        when(familyLinkRepository.findAllFamilyByElderlyIdAndStatus(10L, FamilyLinkStatus.ACTIVE))
            .thenReturn(List.of(familyLink));
        when(emergencyEventRepository.save(any(EmergencyEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        EmergencyEventResponse resp = emergencyEventService.cancel(5L, 10L);

        assertEquals(EmergencyStatus.CANCELLED, resp.getStatus());
        assertNotNull(resp.getResolvedAt());
        verify(fcmService).sendToUsers(eq(List.of(20L)), eq("Thông báo an toàn"), anyString(), anyMap());
        verify(notificationService).createForUsers(eq(List.of(20L)), eq(NotificationType.EMERGENCY), anyString(), anyString(), anyMap());
    }

    @Test
    void testLogEmergencyCall_recordsCallAudit() {
        // AC7
        EmergencyEvent event = EmergencyEvent.builder()
            .id(6L)
            .elderly(elderlyUser)
            .status(EmergencyStatus.ACTIVE)
            .escalationLevel(2)
            .build();

        when(emergencyEventRepository.findById(6L)).thenReturn(Optional.of(event));
        when(userRepository.findById(20L)).thenReturn(Optional.of(familyUser));
        when(emergencyEventRepository.save(any(EmergencyEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        EmergencyEventResponse resp = emergencyEventService.logEmergencyCall(6L, 20L);

        assertNotNull(resp.getEmergencyCallLoggedAt());
        assertEquals(20L, resp.getEmergencyCallLoggedBy());
        assertEquals("Con trai Bình", resp.getEmergencyCallLoggedByName());
    }

    @Test
    void testScheduler_idempotentNoDuplicateEscalation() {
        // AC8
        EmergencyEscalationScheduler scheduler = new EmergencyEscalationScheduler(
            emergencyEventRepository, emergencyEventService
        );
        ReflectionTestUtils.setField(scheduler, "escalationEnabled", true);
        ReflectionTestUtils.setField(scheduler, "level1TimeoutMinutes", 3L);
        ReflectionTestUtils.setField(scheduler, "level2TimeoutMinutes", 10L);

        // Event triggered 4 minutes ago, already at level 1 -> should NOT escalate again!
        EmergencyEvent eventLevel1 = EmergencyEvent.builder()
            .id(7L)
            .elderly(elderlyUser)
            .status(EmergencyStatus.ACTIVE)
            .escalationLevel(1)
            .triggeredAt(OffsetDateTime.now().minusMinutes(4))
            .build();

        when(emergencyEventRepository.findByStatusAndAcknowledgedAtIsNullOrderByTriggeredAtAsc(EmergencyStatus.ACTIVE))
            .thenReturn(List.of(eventLevel1));

        scheduler.checkUnacknowledgedEmergencies();

        // Level 1 already satisfied and < 10m, so escalate() must NOT be called
        verify(emergencyEventRepository, never()).findById(7L);
    }
}
