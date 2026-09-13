package com.carenest.backend.scheduler;

import com.carenest.backend.service.RateLimitService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * RateLimitService keeps its request windows and lockout state in memory. Nothing
 * called its eviction routine, so those maps grew for the lifetime of the process
 * (one entry per IP+endpoint and per user that ever failed a login). Sweep them
 * periodically instead.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RateLimitCleanupScheduler {

    private static final long EVICTION_INTERVAL_MS = 30 * 60 * 1000L;

    private final RateLimitService rateLimitService;

    @Scheduled(fixedRate = EVICTION_INTERVAL_MS, initialDelay = EVICTION_INTERVAL_MS)
    public void evictStaleRateLimitEntries() {
        rateLimitService.evictStaleEntries();
        log.debug("Rate limit state swept");
    }
}
