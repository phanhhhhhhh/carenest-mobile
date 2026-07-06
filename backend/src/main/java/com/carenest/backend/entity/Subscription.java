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

    /**
     * Plan type: FREE, PREMIUM_MONTHLY, PREMIUM_YEARLY.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PlanType planType;

    /**
     * Current status of this subscription record.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SubscriptionStatus status;

    /**
     * Payment provider: VNPAY, MOMO, MANUAL.
     */
    @Column(length = 20)
    private String paymentProvider;

    /**
     * External transaction reference from payment gateway.
     */
    @Column(length = 100)
    private String transactionId;

    /**
     * Amount paid (in VND).
     */
    private BigDecimal amount;

    @Column(nullable = false)
    private Instant startDate;

    private Instant endDate;

    /**
     * When this subscription was cancelled (if applicable).
     */
    private Instant cancelledAt;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;

    public enum PlanType {
        FREE, PREMIUM_MONTHLY, PREMIUM_YEARLY
    }

    public enum SubscriptionStatus {
        ACTIVE, EXPIRED, CANCELLED, PENDING
    }

    /**
     * Check if this subscription is currently active.
     */
    public boolean isActive() {
        return status == SubscriptionStatus.ACTIVE
            && endDate != null
            && endDate.isAfter(Instant.now());
    }

    /**
     * Check if the user has access to premium features.
     */
    public boolean isPremium() {
        return isActive()
            && (planType == PlanType.PREMIUM_MONTHLY || planType == PlanType.PREMIUM_YEARLY);
    }
}
