package com.carenest.backend.scheduler;

import com.carenest.backend.service.WeeklySummaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Generates weekly health summaries for all elderly users.
 * Runs every Monday at 8:00 AM Vietnam time.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WeeklySummaryScheduler {

    private final WeeklySummaryService weeklySummaryService;

    @Scheduled(cron = "0 0 8 * * MON", zone = "Asia/Ho_Chi_Minh")
    public void generateWeeklySummaries() {
        log.info("WeeklySummaryScheduler: starting weekly summary generation...");
        try {
            int count = weeklySummaryService.generateAllSummaries();
            log.info("WeeklySummaryScheduler: completed — {} summaries generated", count);
        } catch (Exception e) {
            log.error("WeeklySummaryScheduler: failed to generate summaries", e);
        }
    }
}
