package com.carenest.backend.service;

import com.carenest.backend.dto.visit.ConfirmVisitRequest;
import com.carenest.backend.dto.visit.VisitEntryResponse;
import com.carenest.backend.dto.visit.VisitSettingsRequest;
import com.carenest.backend.dto.visit.VisitStreakResponse;
import com.carenest.backend.entity.FamilyLink;
import com.carenest.backend.entity.FamilyLinkStatus;
import com.carenest.backend.entity.FamilyVisit;
import com.carenest.backend.entity.FamilyVisitSettings;
import com.carenest.backend.entity.NotificationType;
import com.carenest.backend.entity.User;
import com.carenest.backend.entity.UserRole;
import com.carenest.backend.entity.VisitCycleType;
import com.carenest.backend.exception.NotFoundException;
import com.carenest.backend.repository.FamilyLinkRepository;
import com.carenest.backend.repository.FamilyVisitRepository;
import com.carenest.backend.repository.FamilyVisitSettingsRepository;
import com.carenest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Home Visit Reminder / Visit Streak (UC A7). Confirmation is manual only — this
 * service never reads camera or motion data. A "streak" counts consecutive
 * weekly or monthly cycles that contain at least one confirmed visit; it never
 * ranks or compares individual family members.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class VisitStreakService {

    private static final int RECENT_VISIT_LIMIT = 20;

    private final FamilyVisitRepository visitRepository;
    private final FamilyVisitSettingsRepository settingsRepository;
    private final FamilyLinkRepository familyLinkRepository;
    private final UserRepository userRepository;
    private final FcmService fcmService;
    private final NotificationService notificationService;
    private final VisitStreakCalculator streakCalculator;

    @Transactional
    public VisitStreakResponse getStreak(Long elderlyId) {
        FamilyVisitSettings settings = loadOrCreateSettings(elderlyId);
        VisitStreakCalculator.Result result = recalculate(settings, Instant.now(), false);
        return toResponse(settings, recentVisits(elderlyId), result);
    }

    @Transactional
    public VisitStreakResponse updateSettings(Long elderlyId, VisitSettingsRequest request) {
        FamilyVisitSettings settings = loadOrCreateSettings(elderlyId);
        boolean settingsChanged = false;
        if (request.getCycleType() != null && request.getCycleType() != settings.getCycleType()) {
            settings.setCycleType(request.getCycleType());
            settingsChanged = true;
        }
        if (request.getEnabled() != null && request.getEnabled() != settings.isEnabled()) {
            settings.setEnabled(request.getEnabled());
            settingsChanged = true;
        }
        VisitStreakCalculator.Result result = recalculate(settings, Instant.now(), settingsChanged);
        return toResponse(settings, recentVisits(elderlyId), result);
    }

    /** A family member taps "Xác nhận đã về thăm". */
    @Transactional
    public VisitStreakResponse confirmVisit(Long elderlyId, Long memberId, ConfirmVisitRequest request) {
        User elderly = userRepository.findById(elderlyId)
            .orElseThrow(() -> new NotFoundException("User (elderly) not found: " + elderlyId));
        if (elderly.getRole() != UserRole.ELDERLY) {
            throw new IllegalArgumentException("elderlyId must be a user with ELDERLY role");
        }
        User member = userRepository.findById(memberId)
            .orElseThrow(() -> new NotFoundException("User (family) not found: " + memberId));

        OffsetDateTime visitedAt = request != null && request.getVisitedAt() != null
            ? request.getVisitedAt() : OffsetDateTime.now();

        FamilyVisit visit = visitRepository.save(FamilyVisit.builder()
            .elderly(elderly)
            .member(member)
            .visitedAt(visitedAt)
            .note(request != null ? request.getNote() : null)
            .build());

        FamilyVisitSettings settings = loadOrCreateSettings(elderlyId);
        VisitStreakCalculator.Result result = recalculate(settings, Instant.now(), false);

        notifyFamilyOfVisit(elderly, member, settings);

        log.info("Visit confirmed: elderlyId={} memberId={} visitId={} streak={}",
            elderlyId, memberId, visit.getId(), settings.getCurrentStreak());

        return toResponse(settings, recentVisits(elderlyId), result);
    }

    // --- streak maths ----------------------------------------------------------

    public static LocalDate cycleStart(LocalDate date, VisitCycleType type) {
        return VisitStreakCalculator.cycleStart(date, type);
    }

    public static LocalDate previousCycleStart(LocalDate cycleStart, VisitCycleType type) {
        return VisitStreakCalculator.previousCycleStart(cycleStart, type);
    }

    public static LocalDate nextCycleStart(LocalDate cycleStart, VisitCycleType type) {
        return VisitStreakCalculator.nextCycleStart(cycleStart, type);
    }

    // --- helpers -------------------------------------------------------------

    FamilyVisitSettings loadOrCreateSettings(Long elderlyId) {
        return settingsRepository.findByElderlyId(elderlyId).orElseGet(() -> {
            User elderly = userRepository.findById(elderlyId)
                .orElseThrow(() -> new NotFoundException("User (elderly) not found: " + elderlyId));
            return settingsRepository.save(FamilyVisitSettings.builder().elderly(elderly).build());
        });
    }

    private VisitStreakCalculator.Result recalculate(
        FamilyVisitSettings settings,
        Instant currentInstant,
        boolean settingsChanged
    ) {
        VisitStreakCalculator.Result result = streakCalculator.calculate(
            visitRepository.findVisitTimestampsByElderlyId(settings.getElderly().getId()),
            settings.getCycleType(),
            currentInstant);
        boolean changed = settingsChanged
            || settings.getCurrentStreak() != result.currentStreak()
            || settings.getLongestStreak() != result.longestStreak()
            || !sameInstant(settings.getLastVisitAt(), result.lastVisitAt());
        if (changed) {
            settings.setCurrentStreak(result.currentStreak());
            settings.setLongestStreak(result.longestStreak());
            settings.setLastVisitAt(result.lastVisitAt());
            settingsRepository.save(settings);
        }
        return result;
    }

    private static boolean sameInstant(OffsetDateTime left, OffsetDateTime right) {
        if (left == null || right == null) {
            return Objects.equals(left, right);
        }
        return left.toInstant().equals(right.toInstant());
    }

    private List<FamilyVisit> recentVisits(Long elderlyId) {
        return visitRepository.findRecentByElderlyId(
            elderlyId, PageRequest.of(0, RECENT_VISIT_LIMIT));
    }

    private void notifyFamilyOfVisit(User elderly, User visitor, FamilyVisitSettings settings) {
        List<Long> familyUserIds = familyLinkRepository
            .findAllFamilyByElderlyIdAndStatus(elderly.getId(), FamilyLinkStatus.ACTIVE)
            .stream()
            .map(fl -> fl.getFamily().getId())
            .filter(id -> !id.equals(visitor.getId()))
            .collect(Collectors.toList());
        if (familyUserIds.isEmpty()) {
            return;
        }
        String title = "Có người vừa về thăm nhà";
        String body = visitor.getName() + " vừa xác nhận đã về thăm " + elderly.getName()
            + ". Chuỗi hiện tại: " + settings.getCurrentStreak()
            + (settings.getCycleType() == VisitCycleType.WEEKLY ? " tuần." : " tháng.");
        Map<String, String> data = Map.of(
            "type", "VISIT_CONFIRMED",
            "elderlyId", elderly.getId().toString());
        fcmService.sendToUsers(familyUserIds, title, body, data);
        notificationService.createForUsers(familyUserIds, NotificationType.FAMILY_UPDATE, title, body,
            Map.of("type", "VISIT_CONFIRMED", "elderlyId", elderly.getId()));
    }

    private VisitStreakResponse toResponse(
        FamilyVisitSettings s,
        List<FamilyVisit> visits,
        VisitStreakCalculator.Result result
    ) {
        List<VisitEntryResponse> recent = visits.stream()
            .map(v -> VisitEntryResponse.builder()
                .id(v.getId())
                .memberId(v.getMember().getId())
                .memberName(v.getMember().getName())
                .visitedAt(v.getVisitedAt())
                .note(v.getNote())
                .build())
            .collect(Collectors.toList());

        return VisitStreakResponse.builder()
            .elderlyId(s.getElderly().getId())
            .elderlyName(s.getElderly().getName())
            .enabled(s.isEnabled())
            .cycleType(s.getCycleType())
            .currentStreak(result.currentStreak())
            .longestStreak(result.longestStreak())
            .lastVisitAt(result.lastVisitAt())
            .elderlyBirthday(s.getElderly().getDob())
            .cycleEndsAt(result.cycleEndsAt())
            .streakAtRisk(result.streakAtRisk())
            .visitedThisCycle(result.visitedThisCycle())
            .recentVisits(recent)
            .build();
    }
}
