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

    public enum PlanType {
        FREE, PREMIUM_MONTHLY, PREMIUM_YEARLY
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
            && (planType == PlanType.PREMIUM_MONTHLY || planType == PlanType.PREMIUM_YEARLY);
    }
}
