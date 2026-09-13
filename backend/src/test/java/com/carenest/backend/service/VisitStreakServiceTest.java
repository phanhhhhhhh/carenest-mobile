package com.carenest.backend.service;

import com.carenest.backend.dto.visit.VisitSettingsRequest;
import com.carenest.backend.dto.visit.VisitStreakResponse;
import com.carenest.backend.entity.FamilyVisitSettings;
import com.carenest.backend.entity.User;
import com.carenest.backend.entity.UserRole;
import com.carenest.backend.entity.VisitCycleType;
import com.carenest.backend.repository.FamilyLinkRepository;
import com.carenest.backend.repository.FamilyVisitRepository;
import com.carenest.backend.repository.FamilyVisitSettingsRepository;
import com.carenest.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VisitStreakServiceTest {

    @Mock private FamilyVisitRepository visitRepository;
    @Mock private FamilyVisitSettingsRepository settingsRepository;
    @Mock private FamilyLinkRepository familyLinkRepository;
    @Mock private UserRepository userRepository;
    @Mock private FcmService fcmService;
    @Mock private NotificationService notificationService;
    @Spy private VisitStreakCalculator streakCalculator = new VisitStreakCalculator();

    @InjectMocks private VisitStreakService service;

    private User elderly;
    private FamilyVisitSettings settings;

    @BeforeEach
    void setUp() {
        elderly = User.builder().id(1L).name("Bà Sáu").role(UserRole.ELDERLY).build();
        settings = FamilyVisitSettings.builder().elderly(elderly).cycleType(VisitCycleType.WEEKLY).build();

        lenient().when(userRepository.findById(1L)).thenReturn(Optional.of(elderly));
        lenient().when(settingsRepository.findByElderlyId(1L)).thenReturn(Optional.of(settings));
        lenient().when(settingsRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        lenient().when(visitRepository.findVisitTimestampsByElderlyId(1L)).thenReturn(List.of());
        lenient().when(visitRepository.findRecentByElderlyId(eq(1L), any(Pageable.class)))
            .thenReturn(List.of());
        lenient().when(familyLinkRepository.findAllFamilyByElderlyIdAndStatus(any(), any())).thenReturn(List.of());
    }

    private static OffsetDateTime ict(LocalDate d) {
        return d.atTime(10, 0).atOffset(ZoneOffset.ofHours(7));
    }

    @Test
    void newlyCreatedSettingsAreDisabled() {
        when(settingsRepository.findByElderlyId(1L)).thenReturn(Optional.empty());

        VisitStreakResponse response = service.getStreak(1L);

        assertFalse(response.isEnabled());
    }

    @Test
    void updateSettingsCanEnableAndDisableFeature() {
        VisitStreakResponse enabledResponse = service.updateSettings(1L,
            VisitSettingsRequest.builder().enabled(true).build());
        assertTrue(enabledResponse.isEnabled());

        VisitStreakResponse disabledResponse = service.updateSettings(1L,
            VisitSettingsRequest.builder().enabled(false).build());
        assertFalse(disabledResponse.isEnabled());
    }

    @Test
    void updateSettingsPreservesEnabledWhenOmitted() {
        settings.setEnabled(true);

        VisitStreakResponse response = service.updateSettings(1L,
            VisitSettingsRequest.builder().cycleType(VisitCycleType.MONTHLY).build());

        assertTrue(response.isEnabled());
        assertEquals(VisitCycleType.MONTHLY, response.getCycleType());
    }

    @Test
    void responseUsesUserDateOfBirth() {
        LocalDate birthday = LocalDate.of(1948, 4, 12);
        elderly.setDob(birthday);

        VisitStreakResponse response = service.getStreak(1L);

        assertEquals(birthday, response.getElderlyBirthday());
    }

    @Test
    void weeklyToMonthlyRecomputesCurrentAndLongest() {
        settings.setCurrentStreak(9);
        settings.setLongestStreak(9);
        YearMonth currentMonth = YearMonth.now(VisitStreakCalculator.ICT);
        when(visitRepository.findVisitTimestampsByElderlyId(1L)).thenReturn(List.of(
            ict(currentMonth.minusMonths(1).atDay(1)),
            ict(currentMonth.atDay(1))));

        VisitStreakResponse response = service.updateSettings(1L,
            VisitSettingsRequest.builder().cycleType(VisitCycleType.MONTHLY).build());

        assertEquals(2, response.getCurrentStreak());
        assertEquals(2, response.getLongestStreak());
    }

    @Test
    void monthlyToWeeklyRecomputesCurrentAndLongest() {
        settings.setCycleType(VisitCycleType.MONTHLY);
        settings.setCurrentStreak(9);
        settings.setLongestStreak(9);
        LocalDate currentWeek = VisitStreakCalculator.cycleStart(
            LocalDate.now(VisitStreakCalculator.ICT), VisitCycleType.WEEKLY);
        when(visitRepository.findVisitTimestampsByElderlyId(1L)).thenReturn(List.of(
            ict(currentWeek.minusWeeks(1)),
            ict(currentWeek)));

        VisitStreakResponse response = service.updateSettings(1L,
            VisitSettingsRequest.builder().cycleType(VisitCycleType.WEEKLY).build());

        assertEquals(2, response.getCurrentStreak());
        assertEquals(2, response.getLongestStreak());
    }

    @Test
    void readingStreakRepairsStaleStoredCounters() {
        settings.setCurrentStreak(99);
        settings.setLongestStreak(99);
        settings.setLastVisitAt(ict(LocalDate.of(2020, 1, 1)));
        LocalDate currentWeek = VisitStreakCalculator.cycleStart(
            LocalDate.now(VisitStreakCalculator.ICT), VisitCycleType.WEEKLY);
        OffsetDateTime latest = ict(currentWeek);
        when(visitRepository.findVisitTimestampsByElderlyId(1L)).thenReturn(List.of(
            ict(currentWeek.minusWeeks(1)), latest));

        VisitStreakResponse response = service.getStreak(1L);

        assertEquals(2, response.getCurrentStreak());
        assertEquals(2, response.getLongestStreak());
        assertEquals(latest.toInstant(), response.getLastVisitAt().toInstant());
        assertEquals(2, settings.getCurrentStreak());
        verify(settingsRepository).save(settings);
    }

    @Test
    void usesTimestampProjectionAndLimitsRecentHistoryAtQueryLevel() {
        service.getStreak(1L);

        verify(visitRepository).findVisitTimestampsByElderlyId(1L);
        org.mockito.ArgumentCaptor<Pageable> captor =
            org.mockito.ArgumentCaptor.forClass(Pageable.class);
        verify(visitRepository).findRecentByElderlyId(eq(1L), captor.capture());
        assertEquals(20, captor.getValue().getPageSize());
    }
}
