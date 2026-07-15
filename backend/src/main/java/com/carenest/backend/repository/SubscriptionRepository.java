package com.carenest.backend.repository;

import com.carenest.backend.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    
    Optional<Subscription> findByUserIdAndStatus(Long userId, Subscription.SubscriptionStatus status);

    
    Optional<Subscription> findByUserIdAndStatusAndPlanTypeIn(
        Long userId,
        Subscription.SubscriptionStatus status,
        List<Subscription.PlanType> planTypes
    );

    
    Optional<Subscription> findByTransactionId(String transactionId);
}
