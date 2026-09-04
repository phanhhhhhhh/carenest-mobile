package com.carenest.backend.service;

import com.carenest.backend.repository.CameraDeviceRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
public class CameraTokenRefreshService {

    private static final long REFRESH_LOCK_ID = 0x43414D455241L;
    private static final int FAILURE_ALERT_THRESHOLD = 2;

    private final CameraDeviceRepository cameraDeviceRepository;
    private final CameraTokenUpdater cameraTokenUpdater;
    private final ImouApiService imouApiService;
    private final JdbcTemplate jdbcTemplate;
    private final TransactionTemplate transactionTemplate;
    private final int maxAttempts;
    private final long retryDelayMs;
    private final AtomicInteger consecutiveFailures = new AtomicInteger();

    public CameraTokenRefreshService(
        CameraDeviceRepository cameraDeviceRepository,
        CameraTokenUpdater cameraTokenUpdater,
        ImouApiService imouApiService,
        JdbcTemplate jdbcTemplate,
        PlatformTransactionManager transactionManager,
        @Value("${imou.token-refresh.retry.max-attempts:3}") int maxAttempts,
        @Value("${imou.token-refresh.retry.delay-ms:1000}") long retryDelayMs
    ) {
        this.cameraDeviceRepository = cameraDeviceRepository;
        this.cameraTokenUpdater = cameraTokenUpdater;
        this.imouApiService = imouApiService;
        this.jdbcTemplate = jdbcTemplate;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
        this.maxAttempts = Math.max(1, maxAttempts);
        this.retryDelayMs = Math.max(0, retryDelayMs);
    }

    public RefreshSummary refreshTokens() {
        Instant startedAt = Instant.now();
        RefreshSummary summary = transactionTemplate.execute(status -> {
            Boolean acquired = jdbcTemplate.queryForObject(
                "SELECT pg_try_advisory_xact_lock(?)", Boolean.class, REFRESH_LOCK_ID);
            if (!Boolean.TRUE.equals(acquired)) {
                log.warn("event=camera_token_refresh status=skipped reason=concurrent_execution");
                return RefreshSummary.concurrentSkip();
            }
            return refreshWithLock();
        });

        if (summary == null) {
            summary = RefreshSummary.failedRun();
        }
        summary = summary.withDuration(Duration.between(startedAt, Instant.now()).toMillis());
        log.info("event=camera_token_refresh eligible={} successful={} skipped={} failed={} durationMs={}",
            summary.eligible(), summary.successful(), summary.skipped(), summary.failed(), summary.durationMs());
        return summary;
    }

    private RefreshSummary refreshWithLock() {
        if (!imouApiService.isConfigured()) {
            log.warn("event=camera_token_refresh status=skipped reason=missing_configuration");
            return new RefreshSummary(0, 0, 0, 0, 0);
        }

        List<Long> cameraIds = cameraDeviceRepository.findIdsWithAccessToken();
        int eligible = cameraIds.size();
        if (eligible == 0) {
            consecutiveFailures.set(0);
            return new RefreshSummary(0, 0, 0, 0, 0);
        }

        String newToken = requestTokenWithRetry();
        if (newToken == null || newToken.isBlank()) {
            int failures = consecutiveFailures.incrementAndGet();
            if (failures >= FAILURE_ALERT_THRESHOLD) {
                log.error("event=camera_token_refresh status=alert reason=repeated_token_request_failure consecutiveFailures={}",
                    failures);
            } else {
                log.warn("event=camera_token_refresh status=failed reason=token_request_failure");
            }
            return new RefreshSummary(eligible, 0, 0, eligible, 0);
        }

        Instant refreshedAt = Instant.now();
        int successful = 0;
        int failed = 0;
        for (Long cameraId : cameraIds) {
            try {
                cameraTokenUpdater.updateToken(cameraId, newToken, refreshedAt);
                successful++;
            } catch (RuntimeException ex) {
                failed++;
                log.error("event=camera_token_refresh_record status=failed cameraId={} errorType={}",
                    cameraId, ex.getClass().getSimpleName());
            }
        }
        if (successful > 0) {
            consecutiveFailures.set(0);
        }
        return new RefreshSummary(eligible, successful, 0, failed, 0);
    }

    private String requestTokenWithRetry() {
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                String token = imouApiService.getAccessToken();
                if (token != null && !token.isBlank()) {
                    return token;
                }
            } catch (RuntimeException ex) {
                log.warn("event=camera_token_refresh_retry attempt={} maxAttempts={} errorType={}",
                    attempt, maxAttempts, ex.getClass().getSimpleName());
            }

            if (attempt < maxAttempts && retryDelayMs > 0) {
                try {
                    Thread.sleep(retryDelayMs);
                } catch (InterruptedException ex) {
                    Thread.currentThread().interrupt();
                    log.warn("event=camera_token_refresh status=failed reason=retry_interrupted");
                    return null;
                }
            }
        }
        return null;
    }

    public record RefreshSummary(int eligible, int successful, int skipped, int failed, long durationMs) {
        private static RefreshSummary concurrentSkip() {
            return new RefreshSummary(0, 0, 1, 0, 0);
        }

        private static RefreshSummary failedRun() {
            return new RefreshSummary(0, 0, 0, 1, 0);
        }

        private RefreshSummary withDuration(long durationMs) {
            return new RefreshSummary(eligible, successful, skipped, failed, Math.max(0, durationMs));
        }
    }
}
