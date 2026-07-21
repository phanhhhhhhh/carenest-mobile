package com.carenest.backend.service;

import com.carenest.backend.entity.SchedulerState;
import com.carenest.backend.repository.SchedulerStateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.OffsetDateTime;

/**
 * Tracks the last successful run of a scheduled job so the next run can
 * process [lastRunAt, now] instead of a fixed lookback window — a fixed
 * window silently drops anything that fell due while the server was down.
 */
@Service
@RequiredArgsConstructor
public class SchedulerStateService {

    private final SchedulerStateRepository schedulerStateRepository;

    @Transactional
    public OffsetDateTime getLastRunAndAdvance(String jobName, OffsetDateTime now, Duration fallbackLookback) {
        SchedulerState state = schedulerStateRepository.findByJobName(jobName).orElse(null);

        OffsetDateTime from = state != null ? state.getLastRunAt() : now.minus(fallbackLookback);

        if (state == null) {
            state = SchedulerState.builder().jobName(jobName).lastRunAt(now).build();
        } else {
            state.setLastRunAt(now);
        }
        schedulerStateRepository.save(state);

        return from;
    }
}
