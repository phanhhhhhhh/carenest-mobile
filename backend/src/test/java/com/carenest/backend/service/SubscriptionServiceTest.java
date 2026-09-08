package com.carenest.backend.service;

import com.carenest.backend.entity.FamilyLink;
import com.carenest.backend.entity.FamilyLinkStatus;
import com.carenest.backend.entity.Subscription;
import com.carenest.backend.entity.User;
import com.carenest.backend.exception.PaymentRequiredException;
import com.carenest.backend.repository.FamilyLinkRepository;
import com.carenest.backend.repository.SubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubscriptionServiceTest {

    @Mock private SubscriptionRepository subscriptionRepository;
    @Mock private FamilyLinkRepository familyLinkRepository;
    @InjectMocks private SubscriptionService service;

    private User familyUser;
    private User elderlyUser;

    @BeforeEach
    void setUp() {
        familyUser = User.builder().id(100L).name("Family User").build();
        elderlyUser = User.builder().id(200L).name("Elderly User").build();
    }

    @Test
    void activeMonthlyPremiumPasses() {
        stub(Subscription.PlanType.PREMIUM_MONTHLY, Subscription.SubscriptionStatus.ACTIVE,
            Instant.now().plusSeconds(3600));

        assertTrue(service.isPremium(7L));
        assertDoesNotThrow(() -> service.requirePremium(7L));
    }

    @Test
    void activeYearlyPremiumPasses() {
        stub(Subscription.PlanType.PREMIUM_YEARLY, Subscription.SubscriptionStatus.ACTIVE,
            Instant.now().plusSeconds(3600));

        assertTrue(service.isPremium(7L));
        assertDoesNotThrow(() -> service.requirePremium(7L));
    }

    @Test
    void freeSubscriptionFails() {
        // A FREE plan is excluded by the plan-type filter, so the query returns nothing.
        stubEmpty();
        assertRejected();
    }

    @Test
    void missingSubscriptionFails() {
        stubEmpty();
        assertRejected();
    }

    @Test
    void pendingSubscriptionFails() {
        stubEmpty();
        assertRejected();
    }

    @Test
    void cancelledSubscriptionFails() {
        stubEmpty();
        assertRejected();
    }

    @Test
    void expiredActiveSubscriptionFails() {
        stub(Subscription.PlanType.PREMIUM_MONTHLY, Subscription.SubscriptionStatus.ACTIVE,
            Instant.now().minusSeconds(1));
        assertRejected();
    }

    @Test
    void freePlan_limitsElderlyToOne() {
        when(subscriptionRepository.findByUserIdAndStatusAndPlanTypeIn(
            eq(100L), eq(Subscription.SubscriptionStatus.ACTIVE), any()
        )).thenReturn(Optional.empty());

        assertEquals(1, service.getMaxElderlyProfiles(100L));
        assertFalse(service.isPro(100L));
        assertFalse(service.isPremiumOrPro(100L));
    }

    @Test
    void premiumPlan_limitsElderlyToFour() {
        Subscription premiumSub = createActiveSub(familyUser, Subscription.PlanType.PREMIUM_MONTHLY);
        when(subscriptionRepository.findByUserIdAndStatusAndPlanTypeIn(
            eq(100L), eq(Subscription.SubscriptionStatus.ACTIVE), any()
        )).thenReturn(Optional.of(premiumSub));

        assertEquals(4, service.getMaxElderlyProfiles(100L));
        assertFalse(service.isPro(100L));
        assertTrue(service.isPremiumOrPro(100L));
    }

    @Test
    void canAddElderly_freePlanRejectsSecondElderly() {
        when(subscriptionRepository.findByUserIdAndStatusAndPlanTypeIn(
            eq(100L), eq(Subscription.SubscriptionStatus.ACTIVE), any()
        )).thenReturn(Optional.empty());

        FamilyLink link1 = FamilyLink.builder().id(1L).elderly(elderlyUser).family(familyUser).status(FamilyLinkStatus.ACTIVE).build();
        when(familyLinkRepository.findAllElderlyByFamilyIdAndStatus(100L, FamilyLinkStatus.ACTIVE))
            .thenReturn(List.of(link1));

        assertFalse(service.canAddElderly(100L));
    }

    @Test
    void canAddElderly_premiumPlanAllowsUpToFourElderly() {
        Subscription premiumSub = createActiveSub(familyUser, Subscription.PlanType.PREMIUM_MONTHLY);
        when(subscriptionRepository.findByUserIdAndStatusAndPlanTypeIn(
            eq(100L), eq(Subscription.SubscriptionStatus.ACTIVE), any()
        )).thenReturn(Optional.of(premiumSub));

        FamilyLink link1 = FamilyLink.builder().id(1L).elderly(elderlyUser).family(familyUser).status(FamilyLinkStatus.ACTIVE).build();
        when(familyLinkRepository.findAllElderlyByFamilyIdAndStatus(100L, FamilyLinkStatus.ACTIVE))
            .thenReturn(List.of(link1));

        assertTrue(service.canAddElderly(100L));
    }

    @Test
    void canAddFamilyMember_freePlanRejectsSecondFamilyMember() {
        when(subscriptionRepository.findByUserIdAndStatusAndPlanTypeIn(
            eq(101L), eq(Subscription.SubscriptionStatus.ACTIVE), any()
        )).thenReturn(Optional.empty());

        FamilyLink link1 = FamilyLink.builder().id(1L).elderly(elderlyUser).family(familyUser).status(FamilyLinkStatus.ACTIVE).build();
        when(familyLinkRepository.findAllFamilyByElderlyIdAndStatus(200L, FamilyLinkStatus.ACTIVE))
            .thenReturn(List.of(link1));

        when(subscriptionRepository.findByUserIdInAndStatusAndPlanTypeIn(
            eq(List.of(100L)), eq(Subscription.SubscriptionStatus.ACTIVE), any()
        )).thenReturn(List.of());

        assertFalse(service.canAddFamilyMember(200L, 101L));
    }

    @Test
    void canAddFamilyMember_premiumPlanAllowsUpToSixFamilyMembers() {
        Subscription premiumSub = createActiveSub(familyUser, Subscription.PlanType.PREMIUM_MONTHLY);
        when(subscriptionRepository.findByUserIdAndStatusAndPlanTypeIn(
            eq(100L), eq(Subscription.SubscriptionStatus.ACTIVE), any()
        )).thenReturn(Optional.of(premiumSub));

        FamilyLink link1 = FamilyLink.builder().id(1L).elderly(elderlyUser).family(familyUser).status(FamilyLinkStatus.ACTIVE).build();
        when(familyLinkRepository.findAllFamilyByElderlyIdAndStatus(200L, FamilyLinkStatus.ACTIVE))
            .thenReturn(List.of(link1));

        assertTrue(service.canAddFamilyMember(200L, 100L));
    }

    private Subscription createActiveSub(User user, Subscription.PlanType planType) {
        return Subscription.builder()
            .id(1L)
            .user(user)
            .planType(planType)
            .status(Subscription.SubscriptionStatus.ACTIVE)
            .startDate(Instant.now().minus(1, ChronoUnit.DAYS))
            .endDate(Instant.now().plus(30, ChronoUnit.DAYS))
            .build();
    }

    private void stub(Subscription.PlanType plan, Subscription.SubscriptionStatus status, Instant endDate) {
        Subscription subscription = Subscription.builder()
            .user(User.builder().id(7L).build())
            .planType(plan)
            .status(status)
            .startDate(Instant.now().minusSeconds(3600))
            .endDate(endDate)
            .build();
        when(subscriptionRepository.findByUserIdAndStatusAndPlanTypeIn(
            7L,
            Subscription.SubscriptionStatus.ACTIVE,
            List.of(Subscription.PlanType.PREMIUM_MONTHLY, Subscription.PlanType.PREMIUM_YEARLY)))
            .thenReturn(Optional.of(subscription));
    }

    private void stubEmpty() {
        when(subscriptionRepository.findByUserIdAndStatusAndPlanTypeIn(
            7L,
            Subscription.SubscriptionStatus.ACTIVE,
            List.of(Subscription.PlanType.PREMIUM_MONTHLY, Subscription.PlanType.PREMIUM_YEARLY)))
            .thenReturn(Optional.empty());
    }

    private void assertRejected() {
        assertFalse(service.isPremium(7L));
        assertThrows(PaymentRequiredException.class, () -> service.requirePremium(7L));
    }
}