package com.carenest.backend.service;

import com.carenest.backend.entity.VisitCycleType;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.TreeSet;

/** Pure Visit Streak calculation over distinct ICT visit cycles. */
@Component
public class VisitStreakCalculator {

    public static final ZoneId ICT = ZoneId.of("Asia/Ho_Chi_Minh");

    public Result calculate(
        Collection<OffsetDateTime> visitTimestamps,
        VisitCycleType cycleType,
        Instant currentInstant
    ) {
        Objects.requireNonNull(visitTimestamps, "visitTimestamps");
        Objects.requireNonNull(cycleType, "cycleType");
        Objects.requireNonNull(currentInstant, "currentInstant");

        TreeSet<LocalDate> cycleStarts = new TreeSet<>();
        OffsetDateTime latestValidVisit = null;
        for (OffsetDateTime timestamp : visitTimestamps) {
            if (timestamp == null || timestamp.toInstant().isAfter(currentInstant)) {
                continue;
            }
            cycleStarts.add(cycleStart(timestamp.atZoneSameInstant(ICT).toLocalDate(), cycleType));
            if (latestValidVisit == null
                || timestamp.toInstant().isAfter(latestValidVisit.toInstant())) {
                latestValidVisit = timestamp;
            }
        }

        int longestStreak = 0;
        int runLength = 0;
        LocalDate previous = null;
        Map<LocalDate, Integer> runLengths = new HashMap<>();
        for (LocalDate cycle : cycleStarts) {
            runLength = previous != null && cycle.equals(nextCycleStart(previous, cycleType))
                ? runLength + 1 : 1;
            runLengths.put(cycle, runLength);
            longestStreak = Math.max(longestStreak, runLength);
            previous = cycle;
        }

        LocalDate today = currentInstant.atZone(ICT).toLocalDate();
        LocalDate currentCycleStart = cycleStart(today, cycleType);
        LocalDate previousCycleStart = previousCycleStart(currentCycleStart, cycleType);
        boolean visitedThisCycle = cycleStarts.contains(currentCycleStart);
        int currentStreak = visitedThisCycle
            ? runLengths.get(currentCycleStart)
            : runLengths.getOrDefault(previousCycleStart, 0);
        LocalDate nextCycleStart = nextCycleStart(currentCycleStart, cycleType);
        long daysLeft = ChronoUnit.DAYS.between(today, nextCycleStart);
        boolean streakAtRisk = !visitedThisCycle && currentStreak > 0
            && daysLeft <= (cycleType == VisitCycleType.WEEKLY ? 2 : 4);

        return new Result(
            currentStreak,
            longestStreak,
            latestValidVisit,
            visitedThisCycle,
            streakAtRisk,
            nextCycleStart.atStartOfDay(ICT).toOffsetDateTime());
    }

    public static LocalDate cycleStart(LocalDate date, VisitCycleType type) {
        return type == VisitCycleType.MONTHLY
            ? date.withDayOfMonth(1)
            : date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    public static LocalDate previousCycleStart(LocalDate cycleStart, VisitCycleType type) {
        return type == VisitCycleType.MONTHLY ? cycleStart.minusMonths(1) : cycleStart.minusWeeks(1);
    }

    public static LocalDate nextCycleStart(LocalDate cycleStart, VisitCycleType type) {
        return type == VisitCycleType.MONTHLY ? cycleStart.plusMonths(1) : cycleStart.plusWeeks(1);
    }

    public record Result(
        int currentStreak,
        int longestStreak,
        OffsetDateTime lastVisitAt,
        boolean visitedThisCycle,
        boolean streakAtRisk,
        OffsetDateTime cycleEndsAt
    ) {
    }
}
