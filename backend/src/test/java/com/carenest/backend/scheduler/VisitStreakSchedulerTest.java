package com.carenest.backend.scheduler;

import com.carenest.backend.config.VisitReminderProperties;
import com.carenest.backend.repository.FamilyVisitSettingsRepository;
import com.carenest.backend.service.VisitReminderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VisitStreakSchedulerTest {

    @Mock private FamilyVisitSettingsRepository settingsRepository;
    @Mock private VisitReminderService reminderService;
    private VisitReminderProperties properties;
    private VisitStreakScheduler scheduler;

    @BeforeEach
    void setUp() {
        properties = new VisitReminderProperties();
        scheduler = new VisitStreakScheduler(settingsRepository, reminderService, properties);
    }

    @Test
    void globallyDisabledSchedulerDoesNoWork() {
        properties.setEnabled(false);
        scheduler.runDailyUpkeep();
        verifyNoInteractions(settingsRepository, reminderService);
    }

    @Test
    void processesEnabledCandidateIds() {
        when(settingsRepository.findEnabledIds()).thenReturn(List.of(4L, 9L));
        scheduler.runDailyUpkeep();
        verify(reminderService).processSetting(4L, null);
        verify(reminderService).processSetting(9L, null);
    }

    @Test
    void oneFailureDoesNotPreventRemainingSettings() {
        when(settingsRepository.findEnabledIds()).thenReturn(List.of(4L, 9L));
        doThrow(new IllegalStateException("failed")).when(reminderService).processSetting(4L, null);
        scheduler.runDailyUpkeep();
        verify(reminderService).processSetting(9L, null);
    }

    @Test
    void parsesValidTetAndTurnsInvalidTetIntoNoTetDate() {
        when(settingsRepository.findEnabledIds()).thenReturn(List.of(4L));
        properties.setTetDate("2027-02-06");
        scheduler.runDailyUpkeep();
        verify(reminderService).processSetting(4L, LocalDate.of(2027, 2, 6));

        properties.setTetDate("not-a-date");
        scheduler.runDailyUpkeep();
        verify(reminderService).processSetting(4L, null);
    }
}
