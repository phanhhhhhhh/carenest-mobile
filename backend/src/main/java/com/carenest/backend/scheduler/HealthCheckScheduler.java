package com.carenest.backend.scheduler;

import com.carenest.backend.entity.HealthMetric;
import com.carenest.backend.repository.HealthMetricRepository;
import com.carenest.backend.service.HealthMetricThresholdService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Periodic health check: scans recently recorded health metrics
 * and re-checks them against configured thresholds.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class HealthCheckScheduler {

    private final HealthMetricRepository healthMetricRepository;
    private final HealthMetricThresholdService thresholdService;

    @Scheduled(fixedRate = 900000) // every 15 minutes
    @Transactional
    public void checkRecentMetrics() {
        OffsetDateTime since = OffsetDateTime.now().minusMinutes(20);

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
