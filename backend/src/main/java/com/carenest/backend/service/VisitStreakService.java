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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Map;
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

    static final ZoneId ICT = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final int RECENT_VISIT_LIMIT = 20;

    private final FamilyVisitRepository visitRepository;
    private final FamilyVisitSettingsRepository settingsRepository;
    private final FamilyLinkRepository familyLinkRepository;
    private final UserRepository userRepository;
    private final FcmService fcmService;
    private final NotificationService notificationService;

    @Transactional
    public VisitStreakResponse getStreak(Long elderlyId) {
        FamilyVisitSettings settings = loadOrCreateSettings(elderlyId);
        return toResponse(settings, visitRepository.findByElderlyIdOrderByVisitedAtDesc(elderlyId));
    }

    @Transactional
    public VisitStreakResponse updateSettings(Long elderlyId, VisitSettingsRequest request) {
        FamilyVisitSettings settings = loadOrCreateSettings(elderlyId);
        if (request.getCycleType() != null) {
            settings.setCycleType(request.getCycleType());
        }
        if (request.getElderlyBirthday() != null) {
            settings.setElderlyBirthday(request.getElderlyBirthday());
        }
        settingsRepository.save(settings);
        return toResponse(settings, visitRepository.findByElderlyIdOrderByVisitedAtDesc(elderlyId));
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
        applyVisitToStreak(settings, visitedAt);
        settingsRepository.save(settings);

        notifyFamilyOfVisit(elderly, member, settings);

        log.info("Visit confirmed: elderlyId={} memberId={} visitId={} streak={}",
            elderlyId, memberId, visit.getId(), settings.getCurrentStreak());

        return toResponse(settings, visitRepository.findByElderlyIdOrderByVisitedAtDesc(elderlyId));
    }

    // --- streak maths ----------------------------------------------------------

    private void applyVisitToStreak(FamilyVisitSettings settings, OffsetDateTime visitedAt) {
        LocalDate visitDate = visitedAt.atZoneSameInstant(ICT).toLocalDate();
        LocalDate curCycle = cycleStart(visitDate, settings.getCycleType());

        if (settings.getLastVisitAt() == null || settings.getCurrentStreak() == 0) {
            settings.setCurrentStreak(1);
        } else {
            LocalDate lastCycle = cycleStart(
                settings.getLastVisitAt().atZoneSameInstant(ICT).toLocalDate(), settings.getCycleType());
            if (lastCycle.isEqual(curCycle)) {
                // already counted this cycle — no change
            } else if (lastCycle.isEqual(previousCycleStart(curCycle, settings.getCycleType()))) {
                settings.setCurrentStreak(settings.getCurrentStreak() + 1);
            } else {
                settings.setCurrentStreak(1); // a full cycle was missed
            }
        }

        if (settings.getLastVisitAt() == null || visitedAt.isAfter(settings.getLastVisitAt())) {
            settings.setLastVisitAt(visitedAt);
        }
        settings.setLongestStreak(Math.max(settings.getLongestStreak(), settings.getCurrentStreak()));
    }

    public static LocalDate cycleStart(LocalDate date, VisitCycleType type) {
        return type == VisitCycleType.MONTHLY
            ? date.withDayOfMonth(1)
            : date.with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
    }

    public static LocalDate previousCycleStart(LocalDate cycleStart, VisitCycleType type) {
        return type == VisitCycleType.MONTHLY ? cycleStart.minusMonths(1) : cycleStart.minusWeeks(1);
    }

    public static LocalDate nextCycleStart(LocalDate cycleStart, VisitCycleType type) {
        return type == VisitCycleType.MONTHLY ? cycleStart.plusMonths(1) : cycleStart.plusWeeks(1);
    }

    // --- helpers -------------------------------------------------------------

    FamilyVisitSettings loadOrCreateSettings(Long elderlyId) {
        return settingsRepository.findByElderlyId(elderlyId).orElseGet(() -> {
            User elderly = userRepository.findById(elderlyId)
                .orElseThrow(() -> new NotFoundException("User (elderly) not found: " + elderlyId));
            return settingsRepository.save(FamilyVisitSettings.builder().elderly(elderly).build());
        });
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

    private VisitStreakResponse toResponse(FamilyVisitSettings s, List<FamilyVisit> visits) {
        LocalDate today = LocalDate.now(ICT);
        LocalDate curCycleStart = cycleStart(today, s.getCycleType());
        LocalDate nextCycleStart = nextCycleStart(curCycleStart, s.getCycleType());
        OffsetDateTime cycleEndsAt = nextCycleStart.atStartOfDay(ICT).toOffsetDateTime();

        boolean visitedThisCycle = s.getLastVisitAt() != null
            && !cycleStart(s.getLastVisitAt().atZoneSameInstant(ICT).toLocalDate(), s.getCycleType())
                .isBefore(curCycleStart);

        long daysLeft = java.time.temporal.ChronoUnit.DAYS.between(today, nextCycleStart);
        boolean atRisk = !visitedThisCycle && s.getCurrentStreak() > 0
            && daysLeft <= (s.getCycleType() == VisitCycleType.WEEKLY ? 2 : 4);

        List<VisitEntryResponse> recent = visits.stream()
            .limit(RECENT_VISIT_LIMIT)
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
            .cycleType(s.getCycleType())
            .currentStreak(s.getCurrentStreak())
            .longestStreak(s.getLongestStreak())
            .lastVisitAt(s.getLastVisitAt())
            .elderlyBirthday(s.getElderlyBirthday())
            .cycleEndsAt(cycleEndsAt)
            .streakAtRisk(atRisk)
            .visitedThisCycle(visitedThisCycle)
            .recentVisits(recent)
            .build();
    }
}
