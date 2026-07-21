package com.carenest.backend.scheduler;

import com.carenest.backend.entity.HealthMetric;
import com.carenest.backend.repository.HealthMetricRepository;
import com.carenest.backend.service.HealthMetricThresholdService;
import com.carenest.backend.service.SchedulerStateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;


@Slf4j
@Component
@RequiredArgsConstructor
public class HealthCheckScheduler {

    private static final String JOB_NAME = "health_check_scheduler";

    private final HealthMetricRepository healthMetricRepository;
    private final HealthMetricThresholdService thresholdService;
    private final SchedulerStateService schedulerStateService;

    @Scheduled(fixedRate = 900000)
    @Transactional
    public void checkRecentMetrics() {
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime since = schedulerStateService.getLastRunAndAdvance(JOB_NAME, now, Duration.ofMinutes(20));

        List<HealthMetric> recentMetrics = healthMetricRepository
            .findByRecordedAtAfterAndDeletedAtIsNullOrderByRecordedAtDesc(since);

        int alertsCreated = 0;
        for (HealthMetric metric : recentMetrics) {
            thresholdService.checkAndAlert(metric);
            alertsCreated++;
        }

        if (alertsCreated > 0) {
            log.debug("Health check scanned {} recent metrics", alertsCreated);
        }
    }
}
