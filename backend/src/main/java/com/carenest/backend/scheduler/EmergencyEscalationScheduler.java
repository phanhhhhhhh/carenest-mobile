package com.carenest.backend.scheduler;

import com.carenest.backend.entity.EmergencyEvent;
import com.carenest.backend.entity.EmergencyStatus;
import com.carenest.backend.repository.EmergencyEventRepository;
import com.carenest.backend.service.EmergencyEventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * Scheduled job to check unacknowledged active emergency events and escalate them (Ticket 2).
 * AC1: Escalation Level 1 after level1TimeoutMinutes (default 3m).
 * AC4: Escalation Level 2 (persistent urgent banner / 115 action) after level2TimeoutMinutes (default 10m).
 * AC8: Idempotent - no duplicate notifications for stages already completed.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EmergencyEscalationScheduler {

    private final EmergencyEventRepository emergencyEventRepository;
    private final EmergencyEventService emergencyEventService;

    @Value("${carenest.emergency.escalation.enabled:true}")
    private boolean escalationEnabled;

    @Value("${carenest.emergency.escalation.level1-timeout-minutes:3}")
    private long level1TimeoutMinutes;

    @Value("${carenest.emergency.escalation.level2-timeout-minutes:10}")
    private long level2TimeoutMinutes;

    @Scheduled(fixedDelayString = "${carenest.emergency.escalation.poll-interval-ms:30000}")
    public void checkUnacknowledgedEmergencies() {
        if (!escalationEnabled) {
            return;
        }

        OffsetDateTime now = OffsetDateTime.now();
        List<EmergencyEvent> activeEvents = emergencyEventRepository
            .findByStatusAndAcknowledgedAtIsNullOrderByTriggeredAtAsc(EmergencyStatus.ACTIVE);

        if (activeEvents.isEmpty()) {
            return;
        }

        log.debug("Checking {} active unacknowledged emergency events for escalation", activeEvents.size());

        for (EmergencyEvent event : activeEvents) {
            try {
                if (event.getTriggeredAt() == null) {
                    continue;
                }

                long elapsedMinutes = Duration.between(event.getTriggeredAt(), now).toMinutes();
                int currentLevel = event.getEscalationLevel() != null ? event.getEscalationLevel() : 0;

                if (elapsedMinutes >= level2TimeoutMinutes && currentLevel < 2) {
                    log.info("Event {} reached level 2 timeout (elapsed={}m >= {}m)",
                        event.getId(), elapsedMinutes, level2TimeoutMinutes);
                    emergencyEventService.escalate(event.getId(), 2);
                } else if (elapsedMinutes >= level1TimeoutMinutes && currentLevel < 1) {
                    log.info("Event {} reached level 1 timeout (elapsed={}m >= {}m)",
                        event.getId(), elapsedMinutes, level1TimeoutMinutes);
                    emergencyEventService.escalate(event.getId(), 1);
                }
            } catch (Exception e) {
                log.error("Error during escalation check for eventId={}: {}", event.getId(), e.getMessage(), e);
            }
        }
    }
}
