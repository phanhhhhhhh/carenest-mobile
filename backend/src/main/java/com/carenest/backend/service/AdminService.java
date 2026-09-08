package com.carenest.backend.service;

import com.carenest.backend.dto.admin.AdminAppointmentResponse;
import com.carenest.backend.dto.admin.AdminCameraResponse;
import com.carenest.backend.dto.admin.AdminCheckInResponse;
import com.carenest.backend.dto.admin.AdminElderlyResponse;
import com.carenest.backend.dto.admin.AdminEmergencyResponse;
import com.carenest.backend.dto.admin.AdminFamilyLinkResponse;
import com.carenest.backend.dto.admin.AdminHealthMetricResponse;
import com.carenest.backend.dto.admin.AdminMedicationResponse;
import com.carenest.backend.dto.admin.AdminNotificationResponse;
import com.carenest.backend.dto.admin.AdminOverviewResponse;
import com.carenest.backend.dto.admin.AdminSubscriptionResponse;
import com.carenest.backend.dto.admin.AdminUserDetailResponse;
import com.carenest.backend.dto.admin.AdminUserResponse;
import com.carenest.backend.entity.AppointmentStatus;
import com.carenest.backend.entity.CameraDevice;
import com.carenest.backend.entity.EmergencyStatus;
import com.carenest.backend.entity.FamilyLinkStatus;
import com.carenest.backend.entity.HealthMetricType;
import com.carenest.backend.entity.NotificationType;
import com.carenest.backend.entity.Subscription;
import com.carenest.backend.entity.UserRole;
import com.carenest.backend.exception.NotFoundException;
import com.carenest.backend.repository.AppointmentRepository;
import com.carenest.backend.repository.CameraDeviceRepository;
import com.carenest.backend.repository.ChatMessageRepository;
import com.carenest.backend.repository.CheckInRepository;
import com.carenest.backend.repository.ElderlyProfileRepository;
import com.carenest.backend.repository.EmergencyEventRepository;
import com.carenest.backend.repository.FamilyLinkRepository;
import com.carenest.backend.repository.HealthMetricRepository;
import com.carenest.backend.repository.MedicationRepository;
import com.carenest.backend.repository.NotificationRepository;
import com.carenest.backend.repository.SubscriptionRepository;
import com.carenest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
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
    private final MedicationRepository medicationRepository;
    private final AppointmentRepository appointmentRepository;
    private final CameraDeviceRepository cameraDeviceRepository;
    private final HealthMetricRepository healthMetricRepository;
    private final NotificationRepository notificationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final SubscriptionService subscriptionService;

    public AdminOverviewResponse overview() {
        var ACTIVE = Subscription.SubscriptionStatus.ACTIVE;
        Instant now = Instant.now();

        Map<String, Long> usersByRole = new LinkedHashMap<>();
        for (UserRole role : UserRole.values()) {
            usersByRole.put(role.name(), userRepository.countByRoleAndDeletedAtIsNull(role));
        }

        // "Active" here means a live, unexpired plan — status ACTIVE alone would count
        // lapsed rows because nothing currently transitions them to EXPIRED.
        Map<String, Long> subsByPlan = new LinkedHashMap<>();
        for (Subscription.PlanType plan : Subscription.PlanType.values()) {
            subsByPlan.put(plan.name(),
                subscriptionRepository.countByStatusAndPlanTypeAndEndDateAfter(ACTIVE, plan, now));
        }

        OffsetDateTime startOfDay = OffsetDateTime.now(ICT).toLocalDate().atStartOfDay(ICT).toOffsetDateTime();
        OffsetDateTime endOfDay = startOfDay.plusDays(1);
        OffsetDateTime weekAgo = OffsetDateTime.now(ICT).minusDays(7);
        Instant startOfDayInstant = startOfDay.toInstant();

        return new AdminOverviewResponse(
            userRepository.countByDeletedAtIsNull(),
            usersByRole,
            elderlyProfileRepository.countByDeletedAtIsNull(),
            familyLinkRepository.countByStatusAndDeletedAtIsNull(FamilyLinkStatus.ACTIVE),
            familyLinkRepository.countByStatusAndDeletedAtIsNull(FamilyLinkStatus.PENDING),
            subscriptionRepository.countByStatusAndEndDateAfter(ACTIVE, now),
            subscriptionRepository.countByStatus(Subscription.SubscriptionStatus.PENDING),
            subscriptionRepository.countByStatus(Subscription.SubscriptionStatus.CANCELLED),
            subsByPlan,
            subscriptionRepository.sumAmountByStatusAndNotExpired(ACTIVE, now),
            checkInRepository.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(startOfDay, endOfDay),
            emergencyEventRepository.countByStatus(EmergencyStatus.ACTIVE),
            medicationRepository.countByDeletedAtIsNull(),
            appointmentRepository.countByDeletedAtIsNull(),
            cameraDeviceRepository.count(),
            cameraDeviceRepository.countByStatus(CameraDevice.CameraStatus.ONLINE),
            healthMetricRepository.countByRecordedAtAfterAndDeletedAtIsNull(weekAgo),
            chatMessageRepository.countByCreatedAtAfter(startOfDayInstant),
            notificationRepository.countByCreatedAtAfter(weekAgo)
        );
    }

    public Page<AdminUserResponse> users(String role, String query, Pageable pageable) {
        UserRole roleFilter = parseEnum(UserRole.class, role);
        String q = (query == null) ? "" : query.trim();
        return userRepository.searchForAdmin(roleFilter, q, pageable).map(AdminUserResponse::from);
    }

    public AdminUserDetailResponse userDetail(Long userId) {
        var user = userRepository.findById(userId)
            .filter(u -> u.getDeletedAt() == null)
            .orElseThrow(() -> new NotFoundException("User not found: " + userId));

        AdminElderlyResponse profile = elderlyProfileRepository
            .findByUserIdAndDeletedAtIsNull(userId)
            .map(AdminElderlyResponse::from)
            .orElse(null);

        AdminSubscriptionResponse activeSub = subscriptionRepository
            .findByUserIdAndStatus(userId, Subscription.SubscriptionStatus.ACTIVE)
            .map(AdminSubscriptionResponse::from)
            .orElse(null);

        boolean groupPremium = user.getRole() == UserRole.ELDERLY
            ? subscriptionService.isPremiumForElderly(userId)
            : subscriptionService.isPremium(userId);

        // All statuses (incl. PENDING) for whichever side the user is on, both
        // associations fetched so the mapper never touches a lazy proxy.
        List<AdminFamilyLinkResponse> links = (user.getRole() == UserRole.ELDERLY
            ? familyLinkRepository.findAllForElderlyAdmin(userId)
            : familyLinkRepository.findAllForFamilyAdmin(userId))
            .stream()
            .map(AdminFamilyLinkResponse::from)
            .toList();

        return new AdminUserDetailResponse(
            AdminUserResponse.from(user), profile, activeSub, groupPremium, links);
    }

    public Page<AdminSubscriptionResponse> subscriptions(String status, Pageable pageable) {
        return subscriptionRepository
            .findForAdmin(parseEnum(Subscription.SubscriptionStatus.class, status), pageable)
            .map(AdminSubscriptionResponse::from);
    }

    public Page<AdminElderlyResponse> elderly(Pageable pageable) {
        return elderlyProfileRepository.findForAdmin(pageable).map(AdminElderlyResponse::from);
    }

    public Page<AdminFamilyLinkResponse> familyLinks(String status, Pageable pageable) {
        return familyLinkRepository
            .findForAdmin(parseEnum(FamilyLinkStatus.class, status), pageable)
            .map(AdminFamilyLinkResponse::from);
    }

    public Page<AdminEmergencyResponse> emergencies(String status, Pageable pageable) {
        return emergencyEventRepository
            .findForAdmin(parseEnum(EmergencyStatus.class, status), pageable)
            .map(AdminEmergencyResponse::from);
    }

    public Page<AdminCheckInResponse> checkIns(Pageable pageable) {
        return checkInRepository.findForAdmin(pageable).map(AdminCheckInResponse::from);
    }

    public Page<AdminMedicationResponse> medications(Pageable pageable) {
        return medicationRepository.findForAdmin(pageable).map(AdminMedicationResponse::from);
    }

    public Page<AdminHealthMetricResponse> healthMetrics(String type, Pageable pageable) {
        return healthMetricRepository
            .findForAdmin(parseEnum(HealthMetricType.class, type), pageable)
            .map(AdminHealthMetricResponse::from);
    }

    public Page<AdminCameraResponse> cameras(Pageable pageable) {
        return cameraDeviceRepository.findForAdmin(pageable).map(AdminCameraResponse::from);
    }

    public Page<AdminNotificationResponse> notifications(String type, Pageable pageable) {
        return notificationRepository
            .findForAdmin(parseEnum(NotificationType.class, type), pageable)
            .map(AdminNotificationResponse::from);
    }

    public Page<AdminAppointmentResponse> appointments(String status, Pageable pageable) {
        return appointmentRepository
            .findForAdmin(parseEnum(AppointmentStatus.class, status), pageable)
            .map(AdminAppointmentResponse::from);
    }

    /**
     * null/blank -> {@code null} (no filter). A non-blank value that isn't a valid
     * constant -> 400, rather than silently falling back to "match everything" which
     * would let a typo'd filter return the full table with a 200.
     */
    private static <E extends Enum<E>> E parseEnum(Class<E> type, String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return Enum.valueOf(type, raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Giá trị lọc không hợp lệ: " + raw);
        }
    }
}
