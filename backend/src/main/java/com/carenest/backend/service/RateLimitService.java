package com.carenest.backend.service;

import com.carenest.backend.exception.RateLimitExceededException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory rate limiter for auth endpoints.
 *
 * - Tracks requests per IP using a sliding window (ConcurrentHashMap).
 * - Tracks failed login attempts per userId with lockout after 5 failures.
 * - Thread-safe, no external dependencies.
 */
@Slf4j
@Service
public class RateLimitService {

    private static final int MAX_REQUESTS_PER_MINUTE = 5;
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long LOCKOUT_DURATION_SECONDS = 15 * 60; // 15 min

    // ── Per-IP rate limiting ──────────────────────────────────────────────

    private final ConcurrentHashMap<String, RateWindow> ipWindows = new ConcurrentHashMap<>();

    public void checkRateLimit(String ip, String endpoint) {
        String key = ip + ":" + endpoint;
        Instant now = Instant.now();

        RateWindow window = ipWindows.compute(key, (k, existing) -> {
            if (existing == null || existing.windowStart().plusSeconds(60).isBefore(now)) {
                return new RateWindow(now, 1);
            }
            return new RateWindow(existing.windowStart(), existing.count() + 1);
        });

        if (window != null && window.count() > MAX_REQUESTS_PER_MINUTE) {
            long resetSeconds = window.windowStart().plusSeconds(60).getEpochSecond() - now.getEpochSecond();
            long retryAfter = Math.max(resetSeconds, 1);
            log.warn("Rate limit exceeded for key={}, count={}", key, window.count());
            throw new RateLimitExceededException(
                "Too many requests. Try again in " + retryAfter + " seconds.", retryAfter);
        }
    }

    // ── Failed login tracking & lockout ────────────────────────────────────

    private record LockoutState(int failedCount, Instant lockedUntil, Instant lastAttempt) {}

    private final ConcurrentHashMap<Long, LockoutState> failedLogins = new ConcurrentHashMap<>();

    /**
     * Check if the user is currently locked out. Throws if locked.
     */
    public void checkLockout(Long userId) {
        LockoutState state = failedLogins.get(userId);
        if (state == null) return;

        if (state.lockedUntil() != null && state.lockedUntil().isAfter(Instant.now())) {
            long remainingSeconds = state.lockedUntil().getEpochSecond() - Instant.now().getEpochSecond();
            throw new RateLimitExceededException(
                "Account temporarily locked due to too many failed attempts. Try again in "
                    + remainingSeconds + " seconds.", remainingSeconds);
        }
    }

    /**
     * Record a failed login attempt. Returns true if account is now locked.
     */
    public void recordFailedAttempt(Long userId) {
        failedLogins.compute(userId, (id, existing) -> {
            int newCount = (existing != null) ? existing.failedCount() + 1 : 1;
            Instant lockedUntil = null;
            if (newCount >= MAX_FAILED_ATTEMPTS) {
                lockedUntil = Instant.now().plusSeconds(LOCKOUT_DURATION_SECONDS);
                log.warn("Account locked for userId={} after {} failed attempts until {}",
                    userId, newCount, lockedUntil);
            }
            return new LockoutState(newCount, lockedUntil, Instant.now());
        });
    }

    /**
     * Clear failed attempts on successful login.
     */
    public void clearFailedAttempts(Long userId) {
        failedLogins.remove(userId);
    }

    // ── Cleanup (optional — old entries auto-expire via compute logic) ─────

    public void evictStaleEntries() {
        Instant cutoff = Instant.now().minusSeconds(3600); // 1 hour
        ipWindows.entrySet().removeIf(e -> e.getValue().windowStart().plusSeconds(60).isBefore(cutoff));
        failedLogins.entrySet().removeIf(e -> {
            LockoutState s = e.getValue();
            return s.lockedUntil() == null
                ? s.lastAttempt().isBefore(cutoff)
                : s.lockedUntil().isBefore(cutoff);
        });
    }

    private record RateWindow(Instant windowStart, int count) {}
}
