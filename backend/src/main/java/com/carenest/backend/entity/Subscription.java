package com.carenest.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "subscriptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PlanType planType;

    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SubscriptionStatus status;

    
    @Column(length = 20)
    private String paymentProvider;

    
    @Column(length = 100)
    private String transactionId;

    
    private BigDecimal amount;

    @Column(nullable = false)
    private Instant startDate;

    private Instant endDate;

    
    private Instant cancelledAt;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;

    /**
     * Optimistic lock (V48). Manual VietQR reconciliation (confirm/reject) is a
     * check-then-act sequence on this row with no pessimistic lock; without a
     * version column, two concurrent requests for the same txnRef (two operators,
     * or a retried double-submit) can both pass their check and the later commit
     * silently overwrites the earlier one (lost update — e.g. a just-activated
     * subscription silently flipped back to CANCELLED). With @Version, the loser
     * gets an ObjectOptimisticLockingFailureException (mapped to 409) instead of
     * silent corruption.
     */
    @Version
    @Builder.Default
    private Long version = 0L;

    public enum PlanType {
        FREE, PREMIUM_MONTHLY, PREMIUM_YEARLY, PRO_MONTHLY, PRO_YEARLY
    }

    public enum SubscriptionStatus {
        ACTIVE, EXPIRED, CANCELLED, PENDING
    }

    
    public boolean isActive() {
        return status == SubscriptionStatus.ACTIVE
            && endDate != null
            && endDate.isAfter(Instant.now());
    }

    
    public boolean isPremium() {
        return isActive()
            && (planType == PlanType.PREMIUM_MONTHLY
                || planType == PlanType.PREMIUM_YEARLY
                || planType == PlanType.PRO_MONTHLY
                || planType == PlanType.PRO_YEARLY);
    }

    public boolean isPro() {
        return isActive()
            && (planType == PlanType.PRO_MONTHLY || planType == PlanType.PRO_YEARLY);
    }
}
