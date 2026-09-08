package com.carenest.backend.service;

import com.carenest.backend.dto.family.FamilyLinkRequest;
import com.carenest.backend.dto.family.FamilyLinkResponse;
import com.carenest.backend.entity.FamilyLink;
import com.carenest.backend.entity.FamilyLinkStatus;
import com.carenest.backend.entity.User;
import com.carenest.backend.entity.UserRole;
import com.carenest.backend.exception.PaymentRequiredException;
import com.carenest.backend.repository.ElderlyProfileRepository;
import com.carenest.backend.repository.FamilyLinkRepository;
import com.carenest.backend.repository.NotificationRepository;
import com.carenest.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FamilyLinkServiceTest {

    @Mock
    private FamilyLinkRepository familyLinkRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private ElderlyProfileRepository elderlyProfileRepository;

    @Mock
    private SubscriptionService subscriptionService;

    @InjectMocks
    private FamilyLinkService familyLinkService;

    private User familyUser;
    private User elderlyUser;

    @BeforeEach
    void setUp() {
        familyUser = User.builder().id(100L).name("Family User").phone("+84987654321").role(UserRole.FAMILY).build();
        elderlyUser = User.builder().id(200L).name("Elderly User").phone("+84912345678").role(UserRole.ELDERLY).build();
    }

    @Test
    void create_throwsWhenElderlyLimitReached() {
        FamilyLinkRequest request = FamilyLinkRequest.builder()
            .elderlyId(200L)
            .familyId(100L)
            .relationship("Con")
            .build();

        when(subscriptionService.canAddElderly(100L)).thenReturn(false);
        when(subscriptionService.getActiveElderlyCount(100L)).thenReturn(1);
        when(subscriptionService.getMaxElderlyProfiles(100L)).thenReturn(1);

        PaymentRequiredException ex = assertThrows(PaymentRequiredException.class, () -> familyLinkService.create(request));
        assertTrue(ex.getMessage().contains("Giới hạn gói cước"));
    }

    @Test
    void create_throwsWhenFamilyMemberLimitReached() {
        FamilyLinkRequest request = FamilyLinkRequest.builder()
            .elderlyId(200L)
            .familyId(100L)
            .relationship("Con")
            .build();

        when(subscriptionService.canAddElderly(100L)).thenReturn(true);
        when(subscriptionService.canAddFamilyMember(200L, 100L)).thenReturn(false);
        when(subscriptionService.getActiveFamilyCount(200L)).thenReturn(1);
        when(subscriptionService.getMaxFamilyAccountsForElderly(200L, 100L)).thenReturn(1);

        PaymentRequiredException ex = assertThrows(PaymentRequiredException.class, () -> familyLinkService.create(request));
        assertTrue(ex.getMessage().contains("Người cao tuổi đã đạt giới hạn"));
    }

    @Test
    void create_successWhenWithinLimits() {
        FamilyLinkRequest request = FamilyLinkRequest.builder()
            .elderlyId(200L)
            .familyId(100L)
            .relationship("Con")
            .build();

        when(subscriptionService.canAddElderly(100L)).thenReturn(true);
        when(subscriptionService.canAddFamilyMember(200L, 100L)).thenReturn(true);
        when(userRepository.findById(200L)).thenReturn(Optional.of(elderlyUser));
        when(userRepository.findById(100L)).thenReturn(Optional.of(familyUser));
        when(familyLinkRepository.findByElderlyIdAndFamilyIdAndDeletedAtIsNull(200L, 100L)).thenReturn(Optional.empty());

        FamilyLink savedLink = FamilyLink.builder()
            .id(1L)
            .elderly(elderlyUser)
            .family(familyUser)
            .relationship("Con")
            .status(FamilyLinkStatus.PENDING)
            .build();
        when(familyLinkRepository.save(any(FamilyLink.class))).thenReturn(savedLink);

        FamilyLinkResponse response = familyLinkService.create(request);

        assertNotNull(response);
        assertEquals(100L, response.getFamilyId());
        assertEquals("+84987654321", response.getFamilyPhone());
        assertEquals("Con", response.getRelationship());
    }
}
