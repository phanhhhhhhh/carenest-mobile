package com.carenest.backend.scheduler;

import com.carenest.backend.service.OtpService;
import com.carenest.backend.service.RateLimitService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * RateLimitService and OtpService keep their request windows and lockout state in
 * memory. Nothing called their eviction routines, so those maps grew for the
 * lifetime of the process (one entry per IP+endpoint, per user that ever failed a
 * login, and per OTP target ever sent/verified). Sweep them periodically instead.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RateLimitCleanupScheduler {

    private static final long EVICTION_INTERVAL_MS = 30 * 60 * 1000L;

    private final RateLimitService rateLimitService;
    private final OtpService otpService;

    @Scheduled(fixedRate = EVICTION_INTERVAL_MS, initialDelay = EVICTION_INTERVAL_MS)
    public void evictStaleRateLimitEntries() {
        rateLimitService.evictStaleEntries();
        otpService.evictStaleEntries();
        log.debug("Rate limit state swept");
    }
}
