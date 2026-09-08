package com.carenest.backend.dto.admin;

import com.carenest.backend.entity.Subscription;

import java.math.BigDecimal;
import java.time.Instant;

public record AdminSubscriptionResponse(
    Long id,
    Long userId,
    String userName,
    String userPhone,
    String planType,
    String status,
    String paymentProvider,
    String transactionId,
    BigDecimal amount,
    Instant startDate,
    Instant endDate,
    Instant cancelledAt,
    Instant createdAt
) {
    public static AdminSubscriptionResponse from(Subscription s) {
        return new AdminSubscriptionResponse(
            s.getId(),
            s.getUser() != null ? s.getUser().getId() : null,
            s.getUser() != null ? s.getUser().getName() : null,
            s.getUser() != null ? s.getUser().getPhone() : null,
            s.getPlanType().name(),
            s.getStatus().name(),
            s.getPaymentProvider(),
            s.getTransactionId(),
            s.getAmount(),
            s.getStartDate(),
            s.getEndDate(),
            s.getCancelledAt(),
            s.getCreatedAt()
        );
    }
}
