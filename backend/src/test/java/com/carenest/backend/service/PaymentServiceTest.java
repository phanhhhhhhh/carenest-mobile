package com.carenest.backend.service;

import com.carenest.backend.entity.Subscription;
import com.carenest.backend.repository.SubscriptionRepository;
import com.carenest.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SubscriptionService subscriptionService;

    @InjectMocks
    private PaymentService paymentService;

    private Subscription pending(String txnRef) {
        return Subscription.builder()
            .id(1L)
            .planType(Subscription.PlanType.PREMIUM_MONTHLY)
            .status(Subscription.SubscriptionStatus.PENDING)
            .paymentProvider("VIETQR")
            .transactionId(txnRef)
            .amount(new BigDecimal("49000"))
            .startDate(Instant.now())
            .build();
    }

    @Test
    void rejectManualPayment_marksPendingAsCancelled() {
        Subscription sub = pending("TXN-1");
        when(subscriptionRepository.findByTransactionId("TXN-1")).thenReturn(Optional.of(sub));

        Map<String, String> result = paymentService.rejectManualPayment("TXN-1");

        assertEquals("REJECTED", result.get("status"));
        assertEquals(Subscription.SubscriptionStatus.CANCELLED, sub.getStatus());
        verify(subscriptionRepository).save(sub);
    }

    @Test
    void rejectManualPayment_unknownReference_returnsNotFound() {
        when(subscriptionRepository.findByTransactionId("nope")).thenReturn(Optional.empty());

        Map<String, String> result = paymentService.rejectManualPayment("nope");

        assertEquals("NOT_FOUND", result.get("status"));
        verify(subscriptionRepository, never()).save(any());
    }

    @Test
    void rejectManualPayment_alreadyActive_isRejectedWithoutChange() {
        Subscription sub = pending("TXN-2");
        sub.setStatus(Subscription.SubscriptionStatus.ACTIVE);
        when(subscriptionRepository.findByTransactionId("TXN-2")).thenReturn(Optional.of(sub));

        Map<String, String> result = paymentService.rejectManualPayment("TXN-2");

        assertEquals("ALREADY_ACTIVE", result.get("status"));
        assertEquals(Subscription.SubscriptionStatus.ACTIVE, sub.getStatus());
        verify(subscriptionRepository, never()).save(any());
    }

    @Test
    void confirmManualPayment_unknownReference_returnsNotFound() {
        when(subscriptionRepository.findByTransactionId("ghost")).thenReturn(Optional.empty());

        Map<String, String> result = paymentService.confirmManualPayment("ghost");

        assertEquals("NOT_FOUND", result.get("status"));
    }

    @Test
    void listPendingPayments_mapsRowsForTheOperator() {
        when(subscriptionRepository.findByStatusOrderByStartDateDesc(Subscription.SubscriptionStatus.PENDING))
            .thenReturn(java.util.List.of(pending("TXN-3")));

        var rows = paymentService.listPendingPayments();

        assertEquals(1, rows.size());
        assertEquals("TXN-3", rows.get(0).get("transactionId"));
        assertEquals("PREMIUM_MONTHLY", rows.get(0).get("planType"));
    }
}
