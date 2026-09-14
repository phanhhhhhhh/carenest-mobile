package com.carenest.backend.service;

import com.carenest.backend.dto.visit.ConfirmVisitRequest;
import com.carenest.backend.dto.visit.VisitSettingsRequest;
import com.carenest.backend.dto.visit.VisitStreakResponse;
import com.carenest.backend.entity.FamilyVisit;
import com.carenest.backend.entity.FamilyVisitSettings;
import com.carenest.backend.entity.FamilyLink;
import com.carenest.backend.entity.FamilyLinkStatus;
import com.carenest.backend.entity.NotificationType;
import com.carenest.backend.entity.User;
import com.carenest.backend.entity.UserRole;
import com.carenest.backend.entity.VisitCycleType;
import com.carenest.backend.exception.PossibleDuplicateVisitException;
import com.carenest.backend.repository.FamilyLinkRepository;
import com.carenest.backend.repository.FamilyVisitRepository;
import com.carenest.backend.repository.FamilyVisitSettingsRepository;
import com.carenest.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VisitStreakServiceTest {

    private static final Instant NOW = Instant.parse("2026-09-13T17:30:00Z");

    @Mock private FamilyVisitRepository visitRepository;
    @Mock private FamilyVisitSettingsRepository settingsRepository;
    @Mock private FamilyLinkRepository familyLinkRepository;
    @Mock private UserRepository userRepository;
    @Mock private FcmService fcmService;
    @Mock private NotificationService notificationService;
    private VisitStreakService service;

    private User elderly;
    private User member;
    private FamilyVisitSettings settings;
    private List<OffsetDateTime> visitTimestamps;
    private Clock clock;

    @BeforeEach
    void setUp() {
        elderly = User.builder().id(1L).name("Bà Sáu").role(UserRole.ELDERLY).build();
        member = User.builder().id(2L).name("Anh Tư").role(UserRole.FAMILY).build();
        settings = FamilyVisitSettings.builder().elderly(elderly).cycleType(VisitCycleType.WEEKLY).build();
        visitTimestamps = new ArrayList<>();
        clock = Clock.fixed(NOW, VisitStreakCalculator.ICT);
        service = new VisitStreakService(
            visitRepository,
            settingsRepository,
            familyLinkRepository,
            userRepository,
            fcmService,
            notificationService,
            new VisitStreakCalculator(),
            clock);

        lenient().when(userRepository.findByIdForVisitUpdate(1L)).thenReturn(Optional.of(elderly));
        lenient().when(userRepository.findById(2L)).thenReturn(Optional.of(member));
        lenient().when(settingsRepository.findByElderlyId(1L)).thenReturn(Optional.of(settings));
        lenient().when(settingsRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        lenient().when(visitRepository
            .existsByElderlyIdAndMemberIdAndVisitedAtGreaterThanEqualAndVisitedAtLessThan(
                any(), any(), any(), any()))
            .thenReturn(false);
        lenient().when(visitRepository.save(any(FamilyVisit.class))).thenAnswer(invocation -> {
            FamilyVisit visit = invocation.getArgument(0);
            visit.setId(100L + visitTimestamps.size());
            visitTimestamps.add(visit.getVisitedAt());
            return visit;
        });
        lenient().when(visitRepository.findVisitTimestampsByElderlyId(1L))
            .thenAnswer(i -> List.copyOf(visitTimestamps));
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
        YearMonth currentMonth = YearMonth.now(clock);
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
            LocalDate.now(clock), VisitCycleType.WEEKLY);
        when(visitRepository.findVisitTimestampsByElderlyId(1L)).thenReturn(List.of(
            ict(currentWeek.minusWeeks(1)),
            OffsetDateTime.ofInstant(NOW.minusSeconds(10 * 60), VisitStreakCalculator.ICT)));

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
            LocalDate.now(clock), VisitCycleType.WEEKLY);
        OffsetDateTime latest = OffsetDateTime.ofInstant(
            NOW.minusSeconds(10 * 60), VisitStreakCalculator.ICT);
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

    @Test
    void firstVisitProducesCurrentAndLongestOne() {
        VisitStreakResponse response = service.confirmVisit(1L, 2L, null);

        assertEquals(1, response.getCurrentStreak());
        assertEquals(1, response.getLongestStreak());
    }

    @Test
    void backdatedVisitRepairsHistoricalGap() {
        visitTimestamps.addAll(List.of(
            ict(LocalDate.of(2026, 9, 1)),
            OffsetDateTime.ofInstant(NOW.minusSeconds(20 * 60), VisitStreakCalculator.ICT)));

        VisitStreakResponse response = service.confirmVisit(1L, 2L,
            ConfirmVisitRequest.builder().visitedAt(ict(LocalDate.of(2026, 9, 7))).build());

        assertEquals(3, response.getCurrentStreak());
        assertEquals(3, response.getLongestStreak());
    }

    @Test
    void backdatedVisitDoesNotReplaceNewerLastVisit() {
        OffsetDateTime newest = OffsetDateTime.ofInstant(
            NOW.minusSeconds(10 * 60), VisitStreakCalculator.ICT);
        visitTimestamps.add(newest);

        VisitStreakResponse response = service.confirmVisit(1L, 2L,
            ConfirmVisitRequest.builder().visitedAt(ict(LocalDate.of(2026, 9, 10))).build());

        assertEquals(newest.toInstant(), response.getLastVisitAt().toInstant());
    }

    @Test
    void omittedVisitedAtUsesInjectedClock() {
        service.confirmVisit(1L, 2L, ConfirmVisitRequest.builder().build());

        org.mockito.ArgumentCaptor<FamilyVisit> captor =
            org.mockito.ArgumentCaptor.forClass(FamilyVisit.class);
        verify(visitRepository).save(captor.capture());
        assertEquals(NOW, captor.getValue().getVisitedAt().toInstant());
    }

    @Test
    void sameElderlyMemberAndIctDateIsPossibleDuplicate() {
        OffsetDateTime requested = OffsetDateTime.parse("2026-09-13T16:00:00Z");
        when(visitRepository
            .existsByElderlyIdAndMemberIdAndVisitedAtGreaterThanEqualAndVisitedAtLessThan(
                1L,
                2L,
                OffsetDateTime.parse("2026-09-13T00:00:00+07:00"),
                OffsetDateTime.parse("2026-09-14T00:00:00+07:00")))
            .thenReturn(true);

        assertThrows(PossibleDuplicateVisitException.class, () -> service.confirmVisit(
            1L, 2L, ConfirmVisitRequest.builder().visitedAt(requested).build()));

        verify(visitRepository, never()).save(any(FamilyVisit.class));
        verify(visitRepository, never()).findVisitTimestampsByElderlyId(any());
        verifyNoInteractions(fcmService, notificationService);
    }

    @Test
    void secondIdenticalConfirmationObservesFirstAndIsRejected() {
        when(visitRepository
            .existsByElderlyIdAndMemberIdAndVisitedAtGreaterThanEqualAndVisitedAtLessThan(
                any(), any(), any(), any()))
            .thenReturn(false, true);

        service.confirmVisit(1L, 2L, ConfirmVisitRequest.builder().build());
        assertThrows(PossibleDuplicateVisitException.class,
            () -> service.confirmVisit(1L, 2L, ConfirmVisitRequest.builder().build()));

        verify(visitRepository).save(any(FamilyVisit.class));
    }

    @Test
    void separateVisitOverrideBypassesDuplicateQueryAndKeepsOneCycleStep() {
        visitTimestamps.add(OffsetDateTime.parse("2026-09-13T01:00:00Z"));

        VisitStreakResponse response = service.confirmVisit(1L, 2L,
            ConfirmVisitRequest.builder()
                .visitedAt(OffsetDateTime.parse("2026-09-13T08:00:00Z"))
                .confirmSeparateVisit(true)
                .build());

        assertEquals(1, response.getCurrentStreak());
        verify(visitRepository, never())
            .existsByElderlyIdAndMemberIdAndVisitedAtGreaterThanEqualAndVisitedAtLessThan(
                any(), any(), any(), any());
        verify(visitRepository).save(any(FamilyVisit.class));
    }

    @Test
    void successfulOverrideSendsOneNormalFamilyUpdate() {
        User otherMember = User.builder().id(3L).name("Chi Ba").role(UserRole.FAMILY).build();
        when(familyLinkRepository.findAllFamilyByElderlyIdAndStatus(
            1L, FamilyLinkStatus.ACTIVE))
            .thenReturn(List.of(FamilyLink.builder().elderly(elderly).family(otherMember).build()));

        service.confirmVisit(1L, 2L, ConfirmVisitRequest.builder()
            .confirmSeparateVisit(true)
            .build());

        verify(fcmService).sendToUsers(eq(List.of(3L)), anyString(), anyString(), anyMap());
        verify(notificationService).createForUsers(
            eq(List.of(3L)), eq(NotificationType.FAMILY_UPDATE), anyString(), anyString(), anyMap());
    }

    @Test
    void duplicateCheckUsesMemberIdentity() {
        User otherMember = User.builder().id(3L).name("Chi Ba").role(UserRole.FAMILY).build();
        when(userRepository.findById(3L)).thenReturn(Optional.of(otherMember));

        service.confirmVisit(1L, 3L, ConfirmVisitRequest.builder()
            .visitedAt(OffsetDateTime.parse("2026-09-13T08:00:00Z"))
            .build());

        verify(visitRepository)
            .existsByElderlyIdAndMemberIdAndVisitedAtGreaterThanEqualAndVisitedAtLessThan(
                eq(1L), eq(3L), any(), any());
        verify(visitRepository).save(any(FamilyVisit.class));
    }

    @Test
    void futureInstantIsRejected() {
        ConfirmVisitRequest request = ConfirmVisitRequest.builder()
            .visitedAt(OffsetDateTime.ofInstant(NOW.plusSeconds(1), ZoneOffset.UTC))
            .build();

        assertThrows(IllegalArgumentException.class,
            () -> service.confirmVisit(1L, 2L, request));
        verify(visitRepository, never()).save(any(FamilyVisit.class));
        verify(visitRepository, never())
            .existsByElderlyIdAndMemberIdAndVisitedAtGreaterThanEqualAndVisitedAtLessThan(
                any(), any(), any(), any());
    }

    @Test
    void eightIctCalendarDaysAgoIsRejected() {
        ConfirmVisitRequest request = ConfirmVisitRequest.builder()
            .visitedAt(ict(LocalDate.now(clock).minusDays(8)))
            .build();

        assertThrows(IllegalArgumentException.class,
            () -> service.confirmVisit(1L, 2L, request));
        verify(visitRepository, never())
            .existsByElderlyIdAndMemberIdAndVisitedAtGreaterThanEqualAndVisitedAtLessThan(
                any(), any(), any(), any());
    }

    @Test
    void exactlySevenIctCalendarDaysAgoIsAccepted() {
        OffsetDateTime sevenDaysAgo = ict(LocalDate.now(clock).minusDays(7));

        service.confirmVisit(1L, 2L,
            ConfirmVisitRequest.builder().visitedAt(sevenDaysAgo).build());

        verify(visitRepository).save(any(FamilyVisit.class));
    }

    @Test
    void validationUsesIctDateNearMidnight() {
        OffsetDateTime lateOnEightDaysAgo = LocalDate.now(clock).minusDays(8)
            .atTime(23, 59)
            .atZone(VisitStreakCalculator.ICT)
            .toOffsetDateTime();

        assertThrows(IllegalArgumentException.class, () -> service.confirmVisit(1L, 2L,
            ConfirmVisitRequest.builder().visitedAt(lateOnEightDaysAgo).build()));
    }

    @Test
    void settingsUpdateLocksElderlyBeforeSettingsLookup() {
        service.updateSettings(1L, VisitSettingsRequest.builder().enabled(true).build());

        InOrder order = inOrder(userRepository, settingsRepository);
        order.verify(userRepository).findByIdForVisitUpdate(1L);
        order.verify(settingsRepository).findByElderlyId(1L);
    }

    @Test
    void readingStreakLocksElderlyBeforeLazySettingsLookup() {
        service.getStreak(1L);

        InOrder order = inOrder(userRepository, settingsRepository);
        order.verify(userRepository).findByIdForVisitUpdate(1L);
        order.verify(settingsRepository).findByElderlyId(1L);
    }

    @Test
    void confirmationLocksElderlyBeforeSettingsLookup() {
        service.confirmVisit(1L, 2L, null);

        InOrder order = inOrder(userRepository, settingsRepository);
        order.verify(userRepository).findByIdForVisitUpdate(1L);
        order.verify(settingsRepository).findByElderlyId(1L);
    }

    @Test
    void confirmationChecksDuplicateOnlyAfterTakingElderlyLock() {
        service.confirmVisit(1L, 2L, null);

        InOrder order = inOrder(userRepository, visitRepository);
        order.verify(userRepository).findByIdForVisitUpdate(1L);
        order.verify(visitRepository)
            .existsByElderlyIdAndMemberIdAndVisitedAtGreaterThanEqualAndVisitedAtLessThan(
                eq(1L), eq(2L), any(), any());
    }
}
