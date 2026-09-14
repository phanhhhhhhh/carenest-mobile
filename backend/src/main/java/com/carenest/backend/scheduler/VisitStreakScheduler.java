package com.carenest.backend.scheduler;

import com.carenest.backend.config.VisitReminderProperties;
import com.carenest.backend.repository.FamilyVisitSettingsRepository;
import com.carenest.backend.service.VisitReminderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;

@Slf4j
@Component
@RequiredArgsConstructor
public class VisitStreakScheduler {

    private final FamilyVisitSettingsRepository settingsRepository;
    private final VisitReminderService reminderService;
    private final VisitReminderProperties properties;

    private String lastInvalidTetValueLogged;

    @Scheduled(cron = "0 30 8 * * *", zone = "Asia/Ho_Chi_Minh")
    public void runDailyUpkeep() {
        if (!properties.isEnabled()) {
            return;
        }
        LocalDate tetDate = parseTetDate();
        for (Long settingId : settingsRepository.findEnabledIds()) {
            try {
                reminderService.processSetting(settingId, tetDate);
            } catch (Exception exception) {
                log.error("Visit reminder processing failed for settingId={}", settingId, exception);
            }
        }
    }

    private LocalDate parseTetDate() {
        String configured = properties.getTetDate();
        if (configured == null || configured.isBlank()) {
            lastInvalidTetValueLogged = null;
            return null;
        }
        String value = configured.trim();
        try {
            LocalDate parsed = LocalDate.parse(value);
            lastInvalidTetValueLogged = null;
            return parsed;
        } catch (DateTimeParseException exception) {
            if (!value.equals(lastInvalidTetValueLogged)) {
                log.error("Invalid carenest.visit.tet-date '{}'; expected ISO yyyy-MM-dd", value);
                lastInvalidTetValueLogged = value;
            }
            return null;
        }
    }
}
