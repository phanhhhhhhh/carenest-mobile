package com.carenest.backend.scheduler;

import com.carenest.backend.entity.FamilyLinkStatus;
import com.carenest.backend.entity.FamilyVisitSettings;
import com.carenest.backend.entity.NotificationType;
import com.carenest.backend.entity.VisitCycleType;
import com.carenest.backend.repository.FamilyLinkRepository;
import com.carenest.backend.repository.FamilyVisitSettingsRepository;
import com.carenest.backend.service.FcmService;
import com.carenest.backend.service.NotificationService;
import com.carenest.backend.service.VisitStreakService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.MonthDay;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Daily Visit Streak upkeep (UC A7): breaks a streak when a whole cycle passed
 * with no confirmed visit (with a gentle, non-judgemental nudge), warns when the
 * current cycle is about to end unvisited, and sends the independent advance
 * reminders for Tet and the elderly person's birthday.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class VisitStreakScheduler {

    private static final ZoneId ICT = ZoneId.of("Asia/Ho_Chi_Minh");

    private final FamilyVisitSettingsRepository settingsRepository;
    private final FamilyLinkRepository familyLinkRepository;
    private final FcmService fcmService;
    private final NotificationService notificationService;

    @Value("${carenest.visit.enabled:true}")
    private boolean enabled;

    /** Optional solar date of the upcoming Tet holiday, ISO yyyy-MM-dd. */
    @Value("${carenest.visit.tet-date:}")
    private String tetDate;

    @Scheduled(cron = "0 30 8 * * *", zone = "Asia/Ho_Chi_Minh")
    @Transactional
    public void runDailyUpkeep() {
        if (!enabled) {
            return;
        }
        LocalDate today = LocalDate.now(ICT);
        List<FamilyVisitSettings> all = settingsRepository.findAll();

        for (FamilyVisitSettings s : all) {
            try {
                breakStaleStreak(s, today);
                warnCycleEndingUnvisited(s, today);
                remindBirthday(s, today);
                remindTet(s, today);
            } catch (Exception e) {
                log.error("Visit streak upkeep failed for elderlyId={}: {}",
                    s.getElderly().getId(), e.getMessage(), e);
            }
        }
    }

    private void breakStaleStreak(FamilyVisitSettings s, LocalDate today) {
        if (s.getCurrentStreak() == 0) {
            return;
        }
        LocalDate curCycleStart = VisitStreakService.cycleStart(today, s.getCycleType());
        LocalDate prevCycleStart = VisitStreakService.previousCycleStart(curCycleStart, s.getCycleType());

        LocalDate lastVisitCycle = s.getLastVisitAt() == null ? null
            : VisitStreakService.cycleStart(
                s.getLastVisitAt().atZoneSameInstant(ICT).toLocalDate(), s.getCycleType());

        // A whole cycle (the previous one) went by with no visit → streak broken.
        if (lastVisitCycle == null || lastVisitCycle.isBefore(prevCycleStart)) {
            int had = s.getCurrentStreak();
            s.setCurrentStreak(0);
            settingsRepository.save(s);
            notifyFamily(s, "Chuỗi về thăm đã tạm dừng",
                "Cả nhà đã lỡ một " + cycleWord(s) + " chưa về thăm " + s.getElderly().getName()
                    + ". Không sao — về thăm lần tới để bắt đầu lại chuỗi mới nhé.",
                "VISIT_STREAK_BROKEN");
            log.info("Visit streak broken for elderlyId={} (was {})", s.getElderly().getId(), had);
        }
    }

    private void warnCycleEndingUnvisited(FamilyVisitSettings s, LocalDate today) {
        LocalDate curCycleStart = VisitStreakService.cycleStart(today, s.getCycleType());
        LocalDate nextCycleStart = VisitStreakService.nextCycleStart(curCycleStart, s.getCycleType());

        boolean visitedThisCycle = s.getLastVisitAt() != null
            && !VisitStreakService.cycleStart(
                    s.getLastVisitAt().atZoneSameInstant(ICT).toLocalDate(), s.getCycleType())
                .isBefore(curCycleStart);
        if (visitedThisCycle || s.getCurrentStreak() == 0) {
            return;
        }

        long daysLeft = ChronoUnit.DAYS.between(today, nextCycleStart);
        long warnAt = s.getCycleType() == VisitCycleType.WEEKLY ? 2 : 3;
        if (daysLeft == warnAt) {
            notifyFamily(s, "Sắp hết " + cycleWord(s) + " rồi",
                "Chuỗi về thăm " + s.getElderly().getName() + " (" + s.getCurrentStreak() + " "
                    + cycleWord(s) + ") sẽ đứt nếu " + cycleWord(s) + " này chưa ai về thăm.",
                "VISIT_STREAK_AT_RISK");
        }
    }

    private void remindBirthday(FamilyVisitSettings s, LocalDate today) {
        if (s.getElderlyBirthday() == null) {
            return;
        }
        long days = daysUntilAnnual(MonthDay.from(s.getElderlyBirthday()), today);
        if (days >= 1 && days <= 7) {
            notifyFamily(s, "Sắp đến sinh nhật " + s.getElderly().getName(),
                "Còn " + days + " ngày nữa là sinh nhật " + s.getElderly().getName()
                    + ". Sắp xếp về thăm nhà nhé!",
                "VISIT_BIRTHDAY_REMINDER");
        }
    }

    private void remindTet(FamilyVisitSettings s, LocalDate today) {
        if (tetDate == null || tetDate.isBlank()) {
            return;
        }
        LocalDate tet;
        try {
            tet = LocalDate.parse(tetDate.trim());
        } catch (Exception e) {
            return;
        }
        long days = ChronoUnit.DAYS.between(today, tet);
        if (days >= 1 && days <= 10) {
            notifyFamily(s, "Tết sắp đến rồi",
                "Còn " + days + " ngày nữa là Tết. Nhớ sắp xếp về thăm " + s.getElderly().getName() + " nhé!",
                "VISIT_TET_REMINDER");
        }
    }

    private static long daysUntilAnnual(MonthDay target, LocalDate today) {
        LocalDate next;
        try {
            next = target.atYear(today.getYear());
        } catch (java.time.DateTimeException e) { // 29 Feb on a non-leap year
            next = LocalDate.of(today.getYear(), 3, 1);
        }
        if (next.isBefore(today)) {
            try {
                next = target.atYear(today.getYear() + 1);
            } catch (java.time.DateTimeException e) {
                next = LocalDate.of(today.getYear() + 1, 3, 1);
            }
        }
        return ChronoUnit.DAYS.between(today, next);
    }

    private String cycleWord(FamilyVisitSettings s) {
        return s.getCycleType() == VisitCycleType.WEEKLY ? "tuần" : "tháng";
    }

    private void notifyFamily(FamilyVisitSettings s, String title, String body, String type) {
        List<Long> familyUserIds = familyLinkRepository
            .findAllFamilyByElderlyIdAndStatus(s.getElderly().getId(), FamilyLinkStatus.ACTIVE)
            .stream()
            .map(fl -> fl.getFamily().getId())
            .collect(Collectors.toList());
        if (familyUserIds.isEmpty()) {
            return;
        }
        fcmService.sendToUsers(familyUserIds, title, body,
            Map.of("type", type, "elderlyId", s.getElderly().getId().toString()));
        notificationService.createForUsers(familyUserIds, NotificationType.FAMILY_UPDATE, title, body,
            Map.of("type", type, "elderlyId", s.getElderly().getId()));
    }
}
