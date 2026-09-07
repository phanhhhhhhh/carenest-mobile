package com.carenest.backend.service;

import com.carenest.backend.entity.Subscription;
import com.carenest.backend.entity.User;
import com.carenest.backend.exception.PaymentRequiredException;
import com.carenest.backend.repository.FamilyLinkRepository;
import com.carenest.backend.repository.SubscriptionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubscriptionServiceTest {

    @Mock private SubscriptionRepository subscriptionRepository;
    @Mock private FamilyLinkRepository familyLinkRepository;
    @InjectMocks private SubscriptionService service;

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
        stub(Subscription.PlanType.FREE, Subscription.SubscriptionStatus.ACTIVE,
            Instant.now().plusSeconds(3600));
        assertRejected();
    }

    @Test
    void missingSubscriptionFails() {
        when(subscriptionRepository.findByUserIdAndStatus(7L, Subscription.SubscriptionStatus.ACTIVE))
            .thenReturn(Optional.empty());
        assertRejected();
    }

    @Test
    void pendingSubscriptionFails() {
        when(subscriptionRepository.findByUserIdAndStatus(7L, Subscription.SubscriptionStatus.ACTIVE))
            .thenReturn(Optional.empty());
        assertRejected();
    }

    @Test
    void cancelledSubscriptionFails() {
        when(subscriptionRepository.findByUserIdAndStatus(7L, Subscription.SubscriptionStatus.ACTIVE))
            .thenReturn(Optional.empty());
        assertRejected();
    }

    @Test
    void expiredActiveSubscriptionFails() {
        stub(Subscription.PlanType.PREMIUM_MONTHLY, Subscription.SubscriptionStatus.ACTIVE,
            Instant.now().minusSeconds(1));
        assertRejected();
    }

    private void stub(Subscription.PlanType plan, Subscription.SubscriptionStatus status, Instant endDate) {
        Subscription subscription = Subscription.builder()
            .user(User.builder().id(7L).build())
            .planType(plan)
            .status(status)
            .startDate(Instant.now().minusSeconds(3600))
            .endDate(endDate)
            .build();
        when(subscriptionRepository.findByUserIdAndStatus(7L, Subscription.SubscriptionStatus.ACTIVE))
            .thenReturn(Optional.of(subscription));
    }

    private void assertRejected() {
        assertFalse(service.isPremium(7L));
        assertThrows(PaymentRequiredException.class, () -> service.requirePremium(7L));
    }
}
