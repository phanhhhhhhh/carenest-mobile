package com.carenest.backend.service;

import com.carenest.backend.entity.MedicationSchedule;

import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Computes the next dose instant from a medication's schedule (times are
 * "HH:mm" in Vietnam local time). Shared by the CRUD services and the
 * reminder scheduler so their copies can't drift apart.
 */
public final class MedicationScheduleCalculator {

    private static final ZoneId VIETNAM = ZoneId.of("Asia/Ho_Chi_Minh");

    private MedicationScheduleCalculator() {
    }

    public static OffsetDateTime nextDoseTime(MedicationSchedule schedule) {
        if (schedule == null || schedule.getTimes() == null || schedule.getTimes().isEmpty()) {
            return null;
        }

        ZonedDateTime now = ZonedDateTime.now(VIETNAM);

        // Times arrive in insertion order (e.g. "20:00" before "08:00") — sort
        // chronologically so the earliest same-day candidate wins; skip any
        // malformed entry instead of aborting the whole calculation.
        List<LocalTime> times = new ArrayList<>();
        for (String timeStr : schedule.getTimes()) {
            try {
                times.add(LocalTime.parse(timeStr));
            } catch (DateTimeParseException ignored) {
            }
        }
        times.sort(Comparator.naturalOrder());

        List<Integer> daysOfWeek = schedule.getDaysOfWeek();

        for (int dayOffset = 0; dayOffset < 7; dayOffset++) {
            ZonedDateTime candidateDay = now.plusDays(dayOffset);
            int dayValue = candidateDay.getDayOfWeek().getValue();

            if (daysOfWeek != null && !daysOfWeek.isEmpty() && !daysOfWeek.contains(dayValue)) {
                continue;
            }

            for (LocalTime time : times) {
                ZonedDateTime candidate = candidateDay.with(time);
                if (candidate.isAfter(now)) {
                    return candidate.toOffsetDateTime();
                }
            }
        }

        return null;
    }

    /**
     * The most recent scheduled dose instant strictly before now (looking back up
     * to 7 days). Used to detect a dose that was never confirmed (UC B2).
     */
    public static OffsetDateTime previousDoseTime(MedicationSchedule schedule) {
        if (schedule == null || schedule.getTimes() == null || schedule.getTimes().isEmpty()) {
            return null;
        }
        ZonedDateTime now = ZonedDateTime.now(VIETNAM);

        List<LocalTime> times = new ArrayList<>();
        for (String timeStr : schedule.getTimes()) {
            try {
                times.add(LocalTime.parse(timeStr));
            } catch (DateTimeParseException ignored) {
            }
        }
        times.sort(Comparator.reverseOrder());

        List<Integer> daysOfWeek = schedule.getDaysOfWeek();

        for (int dayOffset = 0; dayOffset < 7; dayOffset++) {
            ZonedDateTime candidateDay = now.minusDays(dayOffset);
            int dayValue = candidateDay.getDayOfWeek().getValue();
            if (daysOfWeek != null && !daysOfWeek.isEmpty() && !daysOfWeek.contains(dayValue)) {
                continue;
            }
            for (LocalTime time : times) {
                ZonedDateTime candidate = candidateDay.with(time);
                if (candidate.isBefore(now)) {
                    return candidate.toOffsetDateTime();
                }
            }
        }
        return null;
    }
}
