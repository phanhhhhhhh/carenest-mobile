package com.carenest.backend.repository;

import com.carenest.backend.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    /**
     * Find the current active subscription for a user.
     */
    Optional<Subscription> findByUserIdAndStatus(Long userId, Subscription.SubscriptionStatus status);

    /**
     * Find any active premium subscription for a user.
     */
    Optional<Subscription> findByUserIdAndStatusAndPlanTypeIn(
        Long userId,
        Subscription.SubscriptionStatus status,
        java.util.List<Subscription.PlanType> planTypes
    );

    /**
     * Find by transaction ID for idempotent payment handling.
     */
    Optional<Subscription> findByTransactionId(String transactionId);
}
