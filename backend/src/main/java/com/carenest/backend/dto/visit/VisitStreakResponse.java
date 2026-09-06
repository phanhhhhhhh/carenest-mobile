package com.carenest.backend.dto.visit;

import com.carenest.backend.entity.VisitCycleType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

/** Visit Streak state for a family (UC A7). */
@Getter
@Builder
public class VisitStreakResponse {

    private Long elderlyId;
    private String elderlyName;
    private VisitCycleType cycleType;
    private int currentStreak;
    private int longestStreak;
    private OffsetDateTime lastVisitAt;
    private LocalDate elderlyBirthday;

    /** End of the current cycle (this week's Sunday 23:59 / month end), ICT. */
    private OffsetDateTime cycleEndsAt;

    /** True when the current cycle has no visit yet and is close to ending. */
    private boolean streakAtRisk;

    /** Whether a visit has already been confirmed in the current cycle. */
    private boolean visitedThisCycle;

    private List<VisitEntryResponse> recentVisits;
}
