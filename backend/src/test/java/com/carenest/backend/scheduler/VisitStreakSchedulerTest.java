package com.carenest.backend.scheduler;

import com.carenest.backend.entity.FamilyVisitSettings;
import com.carenest.backend.entity.User;
import com.carenest.backend.entity.UserRole;
import com.carenest.backend.repository.FamilyLinkRepository;
import com.carenest.backend.repository.FamilyVisitSettingsRepository;
import com.carenest.backend.service.FcmService;
import com.carenest.backend.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.OffsetDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VisitStreakSchedulerTest {

    @Mock private FamilyVisitSettingsRepository settingsRepository;
    @Mock private FamilyLinkRepository familyLinkRepository;
    @Mock private FcmService fcmService;
    @Mock private NotificationService notificationService;

    @InjectMocks private VisitStreakScheduler scheduler;

    @Test
    void skipsDisabledSettings() {
        User elderly = User.builder().id(1L).name("Ba Sau").role(UserRole.ELDERLY).build();
        FamilyVisitSettings settings = FamilyVisitSettings.builder()
            .elderly(elderly)
            .enabled(false)
            .currentStreak(3)
            .lastVisitAt(OffsetDateTime.parse("2020-01-01T10:00:00+07:00"))
            .build();
        when(settingsRepository.findAll()).thenReturn(List.of(settings));
        ReflectionTestUtils.setField(scheduler, "enabled", true);

        scheduler.runDailyUpkeep();

        verify(settingsRepository, never()).save(any());
        verifyNoInteractions(familyLinkRepository, fcmService, notificationService);
    }

    @Test
    void breakingStaleCurrentStreakPreservesRecomputedLongestStreak() {
        User elderly = User.builder().id(1L).name("Ba Sau").role(UserRole.ELDERLY).build();
        FamilyVisitSettings settings = FamilyVisitSettings.builder()
            .elderly(elderly)
            .enabled(true)
            .currentStreak(3)
            .longestStreak(7)
            .lastVisitAt(OffsetDateTime.parse("2020-01-01T10:00:00+07:00"))
            .build();
        when(settingsRepository.findAll()).thenReturn(List.of(settings));
        ReflectionTestUtils.setField(scheduler, "enabled", true);

        scheduler.runDailyUpkeep();

        assertEquals(0, settings.getCurrentStreak());
        assertEquals(7, settings.getLongestStreak());
        verify(settingsRepository).save(settings);
    }
}
