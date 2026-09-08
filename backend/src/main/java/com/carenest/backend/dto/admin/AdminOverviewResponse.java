package com.carenest.backend.dto.admin;

import java.math.BigDecimal;
import java.util.Map;

/** Aggregate counts for the admin console landing page. */
public record AdminOverviewResponse(
    long totalUsers,
    Map<String, Long> usersByRole,
    long elderlyProfiles,
    long activeFamilyLinks,
    long pendingFamilyLinks,
    long activeSubscriptions,
    long pendingPayments,
    long cancelledSubscriptions,
    Map<String, Long> subscriptionsByPlan,
    BigDecimal activeSubscriptionRevenue,
    long checkInsToday,
    long activeEmergencies,
    long medications,
    long appointments,
    long camerasTotal,
    long camerasOnline,
    long healthMetrics7d,
    long chatMessagesToday,
    long notifications7d
) {}
