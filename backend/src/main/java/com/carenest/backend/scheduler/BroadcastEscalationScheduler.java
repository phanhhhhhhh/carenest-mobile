package com.carenest.backend.scheduler;

import com.carenest.backend.entity.BroadcastStatus;
import com.carenest.backend.entity.FamilyBroadcast;
import com.carenest.backend.repository.FamilyBroadcastRepository;
import com.carenest.backend.service.NotificationBroadcastService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * Advances in-flight sequential Free Broadcasts (UC A3 / A4): when the current
 * recipient has not acknowledged within {@code advanceTimeoutMinutes}, hand off
 * to the next free family member — or escalate to the whole family once the
 * free list is exhausted or the overall 2 h window has passed.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BroadcastEscalationScheduler {

    private final FamilyBroadcastRepository broadcastRepository;
    private final NotificationBroadcastService broadcastService;

    @Value("${carenest.broadcast.enabled:true}")
    private boolean enabled;

    @Value("${carenest.broadcast.advance-timeout-minutes:15}")
    private long advanceTimeoutMinutes;

    @Scheduled(fixedDelayString = "${carenest.broadcast.poll-interval-ms:60000}")
    public void advanceStaleBroadcasts() {
        if (!enabled) {
            return;
        }

        List<FamilyBroadcast> active = broadcastRepository
            .findByStatusOrderByStartedAtAsc(BroadcastStatus.ACTIVE);
        if (active.isEmpty()) {
            return;
        }

        OffsetDateTime now = OffsetDateTime.now();
        for (FamilyBroadcast broadcast : active) {
            OffsetDateTime lastPaged = broadcast.getCurrentNotifiedAt();
            if (lastPaged == null) {
                continue;
            }
            if (Duration.between(lastPaged, now).toMinutes() < advanceTimeoutMinutes) {
                continue;
            }
            try {
                broadcastService.advanceOrEscalate(broadcast);
            } catch (Exception e) {
                log.error("Failed to advance broadcast {}: {}", broadcast.getId(), e.getMessage(), e);
            }
        }
    }
}
