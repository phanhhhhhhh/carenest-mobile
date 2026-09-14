package com.carenest.backend.service;

import com.carenest.backend.entity.VisitCycleType;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class VisitStreakCalculatorTest {

    private final VisitStreakCalculator calculator = new VisitStreakCalculator();

    @Test
    void firstWeeklyVisitProducesOneStep() {
        VisitStreakCalculator.Result result = weekly("2026-09-16T12:00:00Z",
            "2026-09-16T10:00:00+07:00");

        assertThat(result.currentStreak()).isEqualTo(1);
        assertThat(result.longestStreak()).isEqualTo(1);
    }

    @Test
    void multipleVisitsInSameWeekCountOnce() {
        VisitStreakCalculator.Result result = weekly("2026-09-16T12:00:00Z",
            "2026-09-14T08:00:00+07:00",
            "2026-09-16T10:00:00+07:00");

        assertThat(result.currentStreak()).isEqualTo(1);
        assertThat(result.longestStreak()).isEqualTo(1);
    }

    @Test
    void visitsFromDifferentMembersInSameWeekStillShareOneStep() {
        // The calculator intentionally receives timestamps only, so member identity
        // cannot split a shared family cycle into individual streak steps.
        VisitStreakCalculator.Result result = weekly("2026-09-16T12:00:00Z",
            "2026-09-14T08:00:00+07:00",
            "2026-09-15T08:00:00+07:00");

        assertThat(result.currentStreak()).isEqualTo(1);
    }

    @Test
    void consecutiveWeeksIncrement() {
        VisitStreakCalculator.Result result = weekly("2026-09-16T12:00:00Z",
            "2026-09-01T10:00:00+07:00",
            "2026-09-08T10:00:00+07:00",
            "2026-09-15T10:00:00+07:00");

        assertThat(result.currentStreak()).isEqualTo(3);
        assertThat(result.longestStreak()).isEqualTo(3);
    }

    @Test
    void missingCompletedWeekResetsCurrent() {
        VisitStreakCalculator.Result result = weekly("2026-09-16T12:00:00Z",
            "2026-09-01T10:00:00+07:00");

        assertThat(result.currentStreak()).isZero();
        assertThat(result.longestStreak()).isEqualTo(1);
    }

    @Test
    void historicalRunsStillDetermineLongest() {
        VisitStreakCalculator.Result result = weekly("2026-09-16T12:00:00Z",
            "2026-07-06T10:00:00+07:00",
            "2026-07-13T10:00:00+07:00",
            "2026-07-20T10:00:00+07:00",
            "2026-09-10T10:00:00+07:00");

        assertThat(result.currentStreak()).isEqualTo(1);
        assertThat(result.longestStreak()).isEqualTo(3);
    }

    @Test
    void currentUnvisitedWeekPreservesRunEndingPreviousWeek() {
        VisitStreakCalculator.Result result = weekly("2026-09-16T12:00:00Z",
            "2026-09-01T10:00:00+07:00",
            "2026-09-10T10:00:00+07:00");

        assertThat(result.currentStreak()).isEqualTo(2);
        assertThat(result.visitedThisCycle()).isFalse();
    }

    @Test
    void sundayAndMondayAreDistinctConsecutiveIctCycles() {
        VisitStreakCalculator.Result result = weekly("2026-09-14T05:00:00Z",
            "2026-09-13T23:59:59+07:00",
            "2026-09-14T00:00:00+07:00");

        assertThat(result.currentStreak()).isEqualTo(2);
        assertThat(result.longestStreak()).isEqualTo(2);
    }

    @Test
    void timestampsAreAssignedAfterConversionToIct() {
        VisitStreakCalculator.Result result = weekly("2026-09-14T05:00:00Z",
            "2026-09-13T17:30:00Z");

        assertThat(result.visitedThisCycle()).isTrue();
        assertThat(result.currentStreak()).isEqualTo(1);
    }

    @Test
    void multipleVisitsInSameMonthCountOnce() {
        VisitStreakCalculator.Result result = monthly("2026-03-15T12:00:00Z",
            "2026-03-01T10:00:00+07:00",
            "2026-03-14T10:00:00+07:00");

        assertThat(result.currentStreak()).isEqualTo(1);
        assertThat(result.longestStreak()).isEqualTo(1);
    }

    @Test
    void consecutiveMonthsIncrement() {
        VisitStreakCalculator.Result result = monthly("2026-03-15T12:00:00Z",
            "2026-01-20T10:00:00+07:00",
            "2026-02-20T10:00:00+07:00",
            "2026-03-10T10:00:00+07:00");

        assertThat(result.currentStreak()).isEqualTo(3);
        assertThat(result.longestStreak()).isEqualTo(3);
    }

    @Test
    void missingMonthResetsCurrent() {
        VisitStreakCalculator.Result result = monthly("2026-03-15T12:00:00Z",
            "2026-01-20T10:00:00+07:00");

        assertThat(result.currentStreak()).isZero();
        assertThat(result.longestStreak()).isEqualTo(1);
    }

    @Test
    void decemberAndJanuaryAreConsecutive() {
        VisitStreakCalculator.Result result = monthly("2026-01-15T12:00:00Z",
            "2025-12-20T10:00:00+07:00",
            "2026-01-10T10:00:00+07:00");

        assertThat(result.currentStreak()).isEqualTo(2);
    }

    @Test
    void monthLengthsDoNotAffectAdjacency() {
        VisitStreakCalculator.Result result = monthly("2026-03-31T12:00:00Z",
            "2026-01-31T10:00:00+07:00",
            "2026-02-28T10:00:00+07:00",
            "2026-03-31T10:00:00+07:00");

        assertThat(result.currentStreak()).isEqualTo(3);
    }

    @Test
    void futureLegacyRowsAreIgnored() {
        OffsetDateTime valid = OffsetDateTime.parse("2026-09-15T10:00:00+07:00");
        VisitStreakCalculator.Result result = calculator.calculate(
            List.of(valid, OffsetDateTime.parse("2027-01-01T10:00:00+07:00")),
            VisitCycleType.WEEKLY,
            Instant.parse("2026-09-16T12:00:00Z"));

        assertThat(result.currentStreak()).isEqualTo(1);
        assertThat(result.longestStreak()).isEqualTo(1);
        assertThat(result.lastVisitAt()).isEqualTo(valid);
    }

    private VisitStreakCalculator.Result weekly(String now, String... visits) {
        return calculate(VisitCycleType.WEEKLY, now, visits);
    }

    private VisitStreakCalculator.Result monthly(String now, String... visits) {
        return calculate(VisitCycleType.MONTHLY, now, visits);
    }

    private VisitStreakCalculator.Result calculate(
        VisitCycleType type,
        String now,
        String... visits
    ) {
        return calculator.calculate(
            java.util.Arrays.stream(visits).map(OffsetDateTime::parse).toList(),
            type,
            Instant.parse(now));
    }
}
