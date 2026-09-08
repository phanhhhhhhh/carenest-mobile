package com.carenest.backend.service;

import com.carenest.backend.dto.admin.AdminOverviewResponse;
import com.carenest.backend.dto.admin.AdminSubscriptionResponse;
import com.carenest.backend.dto.admin.AdminUserResponse;
import com.carenest.backend.entity.EmergencyStatus;
import com.carenest.backend.entity.FamilyLinkStatus;
import com.carenest.backend.entity.Subscription;
import com.carenest.backend.entity.User;
import com.carenest.backend.entity.UserRole;
import com.carenest.backend.repository.CheckInRepository;
import com.carenest.backend.repository.ElderlyProfileRepository;
import com.carenest.backend.repository.EmergencyEventRepository;
import com.carenest.backend.repository.FamilyLinkRepository;
import com.carenest.backend.repository.SubscriptionRepository;
import com.carenest.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private SubscriptionRepository subscriptionRepository;
    @Mock private ElderlyProfileRepository elderlyProfileRepository;
    @Mock private FamilyLinkRepository familyLinkRepository;
    @Mock private CheckInRepository checkInRepository;
    @Mock private EmergencyEventRepository emergencyEventRepository;

    @InjectMocks private AdminService service;

    @Test
    void overview_aggregatesCountsFromEachRepository() {
        when(userRepository.countByDeletedAtIsNull()).thenReturn(16L);
        when(userRepository.countByRoleAndDeletedAtIsNull(UserRole.ELDERLY)).thenReturn(5L);
        when(userRepository.countByRoleAndDeletedAtIsNull(UserRole.FAMILY)).thenReturn(10L);
        when(userRepository.countByRoleAndDeletedAtIsNull(UserRole.ADMIN)).thenReturn(1L);

        when(subscriptionRepository.countByStatusAndPlanType(any(), any())).thenReturn(0L);
        when(subscriptionRepository.countByStatus(Subscription.SubscriptionStatus.ACTIVE)).thenReturn(3L);
        when(subscriptionRepository.countByStatus(Subscription.SubscriptionStatus.PENDING)).thenReturn(2L);
        when(subscriptionRepository.countByStatus(Subscription.SubscriptionStatus.CANCELLED)).thenReturn(1L);
        when(subscriptionRepository.sumAmountByStatus(Subscription.SubscriptionStatus.ACTIVE))
            .thenReturn(new BigDecimal("147000"));

        when(elderlyProfileRepository.countByDeletedAtIsNull()).thenReturn(5L);
        when(familyLinkRepository.countByStatusAndDeletedAtIsNull(FamilyLinkStatus.ACTIVE)).thenReturn(8L);
        when(familyLinkRepository.countByStatusAndDeletedAtIsNull(FamilyLinkStatus.PENDING)).thenReturn(1L);
        when(checkInRepository.countByCreatedAtBetween(any(), any())).thenReturn(4L);
        when(emergencyEventRepository.countByStatus(EmergencyStatus.ACTIVE)).thenReturn(0L);

        AdminOverviewResponse r = service.overview();

        assertEquals(16L, r.totalUsers());
        assertEquals(5L, r.usersByRole().get("ELDERLY"));
        assertEquals(10L, r.usersByRole().get("FAMILY"));
        assertEquals(3L, r.activeSubscriptions());
        assertEquals(2L, r.pendingPayments());
        assertEquals(new BigDecimal("147000"), r.activeSubscriptionRevenue());
        assertEquals(4L, r.checkInsToday());
        assertEquals(8L, r.activeFamilyLinks());
    }

    @Test
    void users_passesParsedRoleFilterThrough() {
        Page<User> page = new PageImpl<>(List.of(
            User.builder().id(1L).name("A").phone("+84900000001").role(UserRole.ADMIN).build()));
        when(userRepository.searchForAdmin(eq(UserRole.ADMIN), eq(""), any(Pageable.class)))
            .thenReturn(page);

        Page<AdminUserResponse> result = service.users("admin", "  ", PageRequest.of(0, 25));

        assertEquals(1, result.getTotalElements());
        assertEquals("ADMIN", result.getContent().get(0).role());
    }

    @Test
    void users_unknownRoleBecomesNoFilter() {
        when(userRepository.searchForAdmin(isNull(), eq("nguyen"), any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.<User>of()));

        service.users("banana", "nguyen", PageRequest.of(0, 25));

        ArgumentCaptor<UserRole> roleCaptor = ArgumentCaptor.forClass(UserRole.class);
        org.mockito.Mockito.verify(userRepository)
            .searchForAdmin(roleCaptor.capture(), eq("nguyen"), any(Pageable.class));
        assertNull(roleCaptor.getValue());
    }

    @Test
    void subscriptions_mapsEntityToResponse() {
        Subscription sub = Subscription.builder()
            .id(9L)
            .user(User.builder().id(2L).name("Linda").phone("+84918111001").build())
            .planType(Subscription.PlanType.PREMIUM_MONTHLY)
            .status(Subscription.SubscriptionStatus.ACTIVE)
            .paymentProvider("VIETQR")
            .transactionId("TXN-9")
            .amount(new BigDecimal("49000"))
            .startDate(java.time.Instant.now())
            .build();
        when(subscriptionRepository.findForAdmin(eq(Subscription.SubscriptionStatus.ACTIVE), any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of(sub)));

        Page<AdminSubscriptionResponse> result = service.subscriptions("ACTIVE", PageRequest.of(0, 25));

        AdminSubscriptionResponse row = result.getContent().get(0);
        assertEquals(9L, row.id());
        assertEquals("Linda", row.userName());
        assertEquals("PREMIUM_MONTHLY", row.planType());
        assertEquals("VIETQR", row.paymentProvider());
    }
}
