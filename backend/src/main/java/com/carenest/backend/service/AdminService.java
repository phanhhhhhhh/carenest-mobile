package com.carenest.backend.service;

import com.carenest.backend.dto.admin.AdminOverviewResponse;
import com.carenest.backend.dto.admin.AdminSubscriptionResponse;
import com.carenest.backend.dto.admin.AdminUserResponse;
import com.carenest.backend.entity.EmergencyStatus;
import com.carenest.backend.entity.FamilyLinkStatus;
import com.carenest.backend.entity.Subscription;
import com.carenest.backend.entity.UserRole;
import com.carenest.backend.repository.CheckInRepository;
import com.carenest.backend.repository.ElderlyProfileRepository;
import com.carenest.backend.repository.EmergencyEventRepository;
import com.carenest.backend.repository.FamilyLinkRepository;
import com.carenest.backend.repository.SubscriptionRepository;
import com.carenest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminService {

    private static final ZoneId ICT = ZoneId.of("Asia/Ho_Chi_Minh");

    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final ElderlyProfileRepository elderlyProfileRepository;
    private final FamilyLinkRepository familyLinkRepository;
    private final CheckInRepository checkInRepository;
    private final EmergencyEventRepository emergencyEventRepository;

    public AdminOverviewResponse overview() {
        Map<String, Long> usersByRole = new LinkedHashMap<>();
        for (UserRole role : UserRole.values()) {
            usersByRole.put(role.name(), userRepository.countByRoleAndDeletedAtIsNull(role));
        }

        Map<String, Long> subsByPlan = new LinkedHashMap<>();
        for (Subscription.PlanType plan : Subscription.PlanType.values()) {
            subsByPlan.put(plan.name(),
                subscriptionRepository.countByStatusAndPlanType(
                    Subscription.SubscriptionStatus.ACTIVE, plan));
        }

        OffsetDateTime startOfDay = OffsetDateTime.now(ICT).toLocalDate().atStartOfDay(ICT).toOffsetDateTime();
        OffsetDateTime endOfDay = startOfDay.plusDays(1);

        return new AdminOverviewResponse(
            userRepository.countByDeletedAtIsNull(),
            usersByRole,
            elderlyProfileRepository.countByDeletedAtIsNull(),
            familyLinkRepository.countByStatusAndDeletedAtIsNull(FamilyLinkStatus.ACTIVE),
            familyLinkRepository.countByStatusAndDeletedAtIsNull(FamilyLinkStatus.PENDING),
            subscriptionRepository.countByStatus(Subscription.SubscriptionStatus.ACTIVE),
            subscriptionRepository.countByStatus(Subscription.SubscriptionStatus.PENDING),
            subscriptionRepository.countByStatus(Subscription.SubscriptionStatus.CANCELLED),
            subsByPlan,
            subscriptionRepository.sumAmountByStatus(Subscription.SubscriptionStatus.ACTIVE),
            checkInRepository.countByCreatedAtBetween(startOfDay, endOfDay),
            emergencyEventRepository.countByStatus(EmergencyStatus.ACTIVE)
        );
    }

    public Page<AdminUserResponse> users(String role, String query, Pageable pageable) {
        UserRole roleFilter = parseRole(role);
        String q = (query == null) ? "" : query.trim();
        return userRepository.searchForAdmin(roleFilter, q, pageable).map(AdminUserResponse::from);
    }

    public Page<AdminSubscriptionResponse> subscriptions(String status, Pageable pageable) {
        Subscription.SubscriptionStatus statusFilter = parseSubStatus(status);
        return subscriptionRepository.findForAdmin(statusFilter, pageable)
            .map(AdminSubscriptionResponse::from);
    }

    private static UserRole parseRole(String role) {
        if (role == null || role.isBlank()) return null;
        try {
            return UserRole.valueOf(role.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static Subscription.SubscriptionStatus parseSubStatus(String status) {
        if (status == null || status.isBlank()) return null;
        try {
            return Subscription.SubscriptionStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
