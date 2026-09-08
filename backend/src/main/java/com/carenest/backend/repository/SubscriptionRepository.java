package com.carenest.backend.repository;

import com.carenest.backend.entity.Subscription;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
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

    List<Subscription> findByUserIdInAndStatusAndPlanTypeIn(
        List<Long> userIds,
        Subscription.SubscriptionStatus status,
        List<Subscription.PlanType> planTypes
    );

    Optional<Subscription> findByTransactionId(String transactionId);

    List<Subscription> findByStatusOrderByStartDateDesc(Subscription.SubscriptionStatus status);

    // --- Admin console ---

    long countByStatus(Subscription.SubscriptionStatus status);

    long countByStatusAndPlanType(Subscription.SubscriptionStatus status, Subscription.PlanType planType);

    @Query("SELECT COALESCE(SUM(s.amount), 0) FROM Subscription s WHERE s.status = :status")
    BigDecimal sumAmountByStatus(@Param("status") Subscription.SubscriptionStatus status);

    @Query("SELECT s FROM Subscription s LEFT JOIN FETCH s.user "
        + "WHERE (:status IS NULL OR s.status = :status) "
        + "ORDER BY s.createdAt DESC, s.id DESC")
    Page<Subscription> findForAdmin(
        @Param("status") Subscription.SubscriptionStatus status, Pageable pageable);

    long countByStatusAndEndDateAfter(Subscription.SubscriptionStatus status, java.time.Instant now);

    long countByStatusAndPlanTypeAndEndDateAfter(
        Subscription.SubscriptionStatus status, Subscription.PlanType planType, java.time.Instant now);

    @Query("SELECT COALESCE(SUM(s.amount), 0) FROM Subscription s "
        + "WHERE s.status = :status AND s.endDate > :now")
    BigDecimal sumAmountByStatusAndNotExpired(
        @Param("status") Subscription.SubscriptionStatus status, @Param("now") java.time.Instant now);
}