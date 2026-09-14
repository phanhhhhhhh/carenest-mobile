package com.carenest.backend.service;

import com.carenest.backend.config.VisitReminderProperties;
import com.carenest.backend.entity.FamilyVisitSettings;
import com.carenest.backend.entity.VisitCycleType;
import com.carenest.backend.repository.FamilyVisitRepository;
import com.carenest.backend.repository.FamilyVisitSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.MonthDay;
import java.time.Year;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class VisitReminderService {

    private final FamilyVisitSettingsRepository settingsRepository;
    private final FamilyVisitRepository visitRepository;
    private final VisitStreakCalculator streakCalculator;
    private final VisitReminderDeliveryService deliveryService;
    private final VisitReminderProperties properties;
    private final Clock visitClock;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void processSetting(Long settingId, LocalDate configuredTetDate) {
        FamilyVisitSettings setting = settingsRepository.findByIdForReminderUpdate(settingId)
            .orElse(null);
        if (setting == null || !setting.isEnabled()) {
            return;
        }

        Instant now = visitClock.instant();
        LocalDate today = now.atZone(VisitStreakCalculator.ICT).toLocalDate();
        VisitStreakCalculator.Result streak = streakCalculator.calculate(
            visitRepository.findVisitTimestampsByElderlyId(setting.getElderly().getId()),
            setting.getCycleType(),
            now
        );
        applyStreakState(setting, streak);
        remindCycle(setting, streak, today);
        remindBirthday(setting, today);
        remindTet(setting, configuredTetDate, today);
    }

    private void applyStreakState(FamilyVisitSettings setting, VisitStreakCalculator.Result result) {
        setting.setCurrentStreak(result.currentStreak());
        setting.setLongestStreak(result.longestStreak());
        setting.setLastVisitAt(result.lastVisitAt());
    }

    private void remindCycle(
        FamilyVisitSettings setting,
        VisitStreakCalculator.Result streak,
        LocalDate today
    ) {
        if (streak.visitedThisCycle()) {
            return;
        }
        LocalDate cycleStart = VisitStreakCalculator.cycleStart(today, setting.getCycleType());
        if (cycleStart.equals(setting.getLastCycleReminderStart())) {
            return;
        }
        LocalDate nextCycleStart = VisitStreakCalculator.nextCycleStart(cycleStart, setting.getCycleType());
        long daysRemaining = ChronoUnit.DAYS.between(today, nextCycleStart);
        int leadDays = setting.getCycleType() == VisitCycleType.WEEKLY
            ? properties.getWeeklyLeadDays()
            : properties.getMonthlyLeadDays();
        if (daysRemaining < 1 || daysRemaining > leadDays) {
            return;
        }

        String elderlyName = setting.getElderly().getName();
        String period = setting.getCycleType() == VisitCycleType.WEEKLY ? "Tuần" : "Tháng";
        boolean delivered = deliveryService.createDurableReminder(
            setting.getElderly().getId(),
            "Gợi ý sắp xếp về thăm",
            period + " này gia đình mình chưa có lượt về thăm " + elderlyName
                + ". Nếu thuận tiện, cả nhà thử sắp xếp thời gian nhé.",
            VisitReminderSubtype.VISIT_STREAK_REMINDER
        );
        if (delivered) {
            setting.setLastCycleReminderStart(cycleStart);
        }
    }

    private void remindBirthday(FamilyVisitSettings setting, LocalDate today) {
        if (setting.getElderly().getDob() == null) {
            return;
        }
        LocalDate occurrence = nextBirthdayOccurrence(MonthDay.from(setting.getElderly().getDob()), today);
        long daysRemaining = ChronoUnit.DAYS.between(today, occurrence);
        if (daysRemaining < 1 || daysRemaining > properties.getBirthdayLeadDays()
            || Integer.valueOf(occurrence.getYear()).equals(setting.getLastBirthdayReminderYear())) {
            return;
        }

        String elderlyName = setting.getElderly().getName();
        boolean delivered = deliveryService.createDurableReminder(
            setting.getElderly().getId(),
            "Sắp đến sinh nhật " + elderlyName,
            "Còn " + daysRemaining + " ngày nữa là sinh nhật " + elderlyName
                + ". Nếu thuận tiện, gia đình mình có thể lên kế hoạch về thăm.",
            VisitReminderSubtype.VISIT_BIRTHDAY_REMINDER
        );
        if (delivered) {
            setting.setLastBirthdayReminderYear(occurrence.getYear());
        }
    }

    private void remindTet(FamilyVisitSettings setting, LocalDate tetDate, LocalDate today) {
        if (tetDate == null || tetDate.equals(setting.getLastTetReminderDate())) {
            return;
        }
        long daysRemaining = ChronoUnit.DAYS.between(today, tetDate);
        if (daysRemaining < 1 || daysRemaining > properties.getTetLeadDays()) {
            return;
        }

        boolean delivered = deliveryService.createDurableReminder(
            setting.getElderly().getId(),
            "Tết sắp đến rồi",
            "Còn " + daysRemaining + " ngày nữa là Tết. Nếu thuận tiện, gia đình mình có thể lên kế hoạch về thăm "
                + setting.getElderly().getName() + ".",
            VisitReminderSubtype.VISIT_TET_REMINDER
        );
        if (delivered) {
            setting.setLastTetReminderDate(tetDate);
        }
    }

    static LocalDate nextBirthdayOccurrence(MonthDay birthday, LocalDate today) {
        LocalDate occurrence = birthdayAtYear(birthday, today.getYear());
        if (!occurrence.isAfter(today)) {
            occurrence = birthdayAtYear(birthday, today.getYear() + 1);
        }
        return occurrence;
    }

    private static LocalDate birthdayAtYear(MonthDay birthday, int year) {
        if (birthday.equals(MonthDay.of(2, 29)) && !Year.isLeap(year)) {
            return LocalDate.of(year, 3, 1);
        }
        return birthday.atYear(year);
    }
}
