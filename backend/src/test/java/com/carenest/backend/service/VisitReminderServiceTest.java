package com.carenest.backend.service;

import com.carenest.backend.config.VisitReminderProperties;
import com.carenest.backend.entity.FamilyVisitSettings;
import com.carenest.backend.entity.User;
import com.carenest.backend.entity.UserRole;
import com.carenest.backend.entity.VisitCycleType;
import com.carenest.backend.repository.FamilyVisitRepository;
import com.carenest.backend.repository.FamilyVisitSettingsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VisitReminderServiceTest {

    @Mock private FamilyVisitSettingsRepository settingsRepository;
    @Mock private FamilyVisitRepository visitRepository;
    @Mock private VisitReminderDeliveryService deliveryService;

    private VisitReminderProperties properties;
    private User elderly;
    private FamilyVisitSettings setting;

    @BeforeEach
    void setUp() {
        properties = new VisitReminderProperties();
        elderly = User.builder().id(11L).name("Bà Sáu").role(UserRole.ELDERLY).build();
        setting = FamilyVisitSettings.builder().id(7L).elderly(elderly).enabled(true)
            .cycleType(VisitCycleType.WEEKLY).build();
        lenient().when(settingsRepository.findByIdForReminderUpdate(7L)).thenReturn(Optional.of(setting));
        lenient().when(visitRepository.findVisitTimestampsByElderlyId(11L)).thenReturn(List.of());
        lenient().when(deliveryService.createDurableReminder(
            eq(11L), anyString(), anyString(), eq(VisitReminderSubtype.VISIT_STREAK_REMINDER)))
            .thenReturn(true);
    }

    @Test
    void disabledSettingProducesNoReminder() {
        setting.setEnabled(false);
        serviceAt("2026-09-12T01:30:00Z").processSetting(7L, null);
        verifyNoInteractions(visitRepository, deliveryService);
    }

    @Test
    void weeklyReminderSendsTwoDaysBeforeBoundaryEvenAtZeroStreak() {
        serviceAt("2026-09-12T01:30:00Z").processSetting(7L, null);
        verify(deliveryService).createDurableReminder(11L, "Gợi ý sắp xếp về thăm",
            "Tuần này gia đình mình chưa có lượt về thăm Bà Sáu. Nếu thuận tiện, cả nhà thử sắp xếp thời gian nhé.",
            VisitReminderSubtype.VISIT_STREAK_REMINDER);
        assertEquals(LocalDate.of(2026, 9, 7), setting.getLastCycleReminderStart());
        assertEquals(0, setting.getCurrentStreak());
    }

    @Test
    void lateRunInsideWeeklyWindowStillSends() {
        serviceAt("2026-09-13T01:30:00Z").processSetting(7L, null);
        assertEquals(LocalDate.of(2026, 9, 7), setting.getLastCycleReminderStart());
    }

    @Test
    void monthlyReminderUsesFourDayWindow() {
        setting.setCycleType(VisitCycleType.MONTHLY);
        serviceAt("2026-09-27T01:30:00Z").processSetting(7L, null);
        verify(deliveryService).createDurableReminder(eq(11L), eq("Gợi ý sắp xếp về thăm"),
            eq("Tháng này gia đình mình chưa có lượt về thăm Bà Sáu. Nếu thuận tiện, cả nhà thử sắp xếp thời gian nhé."),
            eq(VisitReminderSubtype.VISIT_STREAK_REMINDER));
        assertEquals(LocalDate.of(2026, 9, 1), setting.getLastCycleReminderStart());
    }

    @Test
    void currentCycleVisitSuppressesReminderAtIctBoundary() {
        when(visitRepository.findVisitTimestampsByElderlyId(11L)).thenReturn(List.of(
            OffsetDateTime.parse("2026-09-07T00:00:00+07:00")));
        serviceAt("2026-09-12T01:30:00Z").processSetting(7L, null);
        verify(deliveryService, never()).createDurableReminder(
            eq(11L), anyString(), anyString(), eq(VisitReminderSubtype.VISIT_STREAK_REMINDER));
    }

    @Test
    void ledgerSuppressesSecondRunButNextCycleCanSend() {
        VisitReminderService first = serviceAt("2026-09-12T01:30:00Z");
        first.processSetting(7L, null);
        first.processSetting(7L, null);
        verify(deliveryService).createDurableReminder(
            eq(11L), anyString(), anyString(), eq(VisitReminderSubtype.VISIT_STREAK_REMINDER));
        serviceAt("2026-09-19T01:30:00Z").processSetting(7L, null);
        assertEquals(LocalDate.of(2026, 9, 14), setting.getLastCycleReminderStart());
    }

    @Test
    void missedCycleRecalculatesZeroWithoutBrokenReminder() {
        setting.setCurrentStreak(3);
        when(visitRepository.findVisitTimestampsByElderlyId(11L)).thenReturn(List.of(
            OffsetDateTime.parse("2026-08-24T10:00:00+07:00")));
        serviceAt("2026-09-08T01:30:00Z").processSetting(7L, null);
        assertEquals(0, setting.getCurrentStreak());
        verifyNoInteractions(deliveryService);
    }

    @Test
    void birthdaySendsOnceInsideWindowAndUsesOccurrenceYearLedger() {
        elderly.setDob(LocalDate.of(1950, 9, 17));
        when(deliveryService.createDurableReminder(
            eq(11L), anyString(), anyString(), eq(VisitReminderSubtype.VISIT_BIRTHDAY_REMINDER)))
            .thenReturn(true);
        VisitReminderService service = serviceAt("2026-09-12T01:30:00Z");
        service.processSetting(7L, null);
        service.processSetting(7L, null);
        verify(deliveryService).createDurableReminder(11L, "Sắp đến sinh nhật Bà Sáu",
            "Còn 5 ngày nữa là sinh nhật Bà Sáu. Nếu thuận tiện, gia đình mình có thể lên kế hoạch về thăm.",
            VisitReminderSubtype.VISIT_BIRTHDAY_REMINDER);
        assertEquals(2026, setting.getLastBirthdayReminderYear());
    }

    @Test
    void birthdayTodayDoesNotSendAndDecemberJanuaryTransitionWorks() {
        elderly.setDob(LocalDate.of(1950, 9, 12));
        serviceAt("2026-09-12T01:30:00Z").processSetting(7L, null);
        verify(deliveryService, never()).createDurableReminder(
            eq(11L), anyString(), anyString(), eq(VisitReminderSubtype.VISIT_BIRTHDAY_REMINDER));
        elderly.setDob(LocalDate.of(1950, 1, 3));
        when(deliveryService.createDurableReminder(
            eq(11L), anyString(), anyString(), eq(VisitReminderSubtype.VISIT_BIRTHDAY_REMINDER)))
            .thenReturn(true);
        serviceAt("2026-12-29T01:30:00Z").processSetting(7L, null);
        assertEquals(2027, setting.getLastBirthdayReminderYear());
    }

    @Test
    void nextBirthdayYearMaySendAgain() {
        elderly.setDob(LocalDate.of(1950, 9, 17));
        setting.setLastBirthdayReminderYear(2026);
        when(deliveryService.createDurableReminder(
            eq(11L), anyString(), anyString(), eq(VisitReminderSubtype.VISIT_BIRTHDAY_REMINDER)))
            .thenReturn(true);

        serviceAt("2027-09-12T01:30:00Z").processSetting(7L, null);

        assertEquals(2027, setting.getLastBirthdayReminderYear());
    }

    @Test
    void february29UsesMarchFirstInNonLeapYear() {
        elderly.setDob(LocalDate.of(1952, 2, 29));
        when(deliveryService.createDurableReminder(
            eq(11L), anyString(), anyString(), eq(VisitReminderSubtype.VISIT_BIRTHDAY_REMINDER)))
            .thenReturn(true);
        serviceAt("2027-02-24T01:30:00Z").processSetting(7L, null);
        verify(deliveryService).createDurableReminder(eq(11L), anyString(),
            eq("Còn 5 ngày nữa là sinh nhật Bà Sáu. Nếu thuận tiện, gia đình mình có thể lên kế hoạch về thăm."),
            eq(VisitReminderSubtype.VISIT_BIRTHDAY_REMINDER));
    }

    @Test
    void tetSendsOnceInsideWindowAndNewOccurrenceCanSend() {
        when(deliveryService.createDurableReminder(
            eq(11L), anyString(), anyString(), eq(VisitReminderSubtype.VISIT_TET_REMINDER)))
            .thenReturn(true);
        LocalDate tet2027 = LocalDate.of(2027, 2, 6);
        VisitReminderService first = serviceAt("2027-01-30T01:30:00Z");
        first.processSetting(7L, tet2027);
        first.processSetting(7L, tet2027);
        assertEquals(tet2027, setting.getLastTetReminderDate());
        verify(deliveryService).createDurableReminder(11L, "Tết sắp đến rồi",
            "Còn 7 ngày nữa là Tết. Nếu thuận tiện, gia đình mình có thể lên kế hoạch về thăm Bà Sáu.",
            VisitReminderSubtype.VISIT_TET_REMINDER);
        LocalDate tet2028 = LocalDate.of(2028, 1, 26);
        serviceAt("2028-01-20T01:30:00Z").processSetting(7L, tet2028);
        assertEquals(tet2028, setting.getLastTetReminderDate());
    }

    @Test
    void tetTodayPastAndBlankProduceNoTetReminder() {
        VisitReminderService service = serviceAt("2027-02-06T01:30:00Z");
        service.processSetting(7L, null);
        service.processSetting(7L, LocalDate.of(2027, 2, 6));
        service.processSetting(7L, LocalDate.of(2027, 2, 5));
        verify(deliveryService, never()).createDurableReminder(
            eq(11L), anyString(), anyString(), eq(VisitReminderSubtype.VISIT_TET_REMINDER));
    }

    @Test
    void failedDurablePersistenceDoesNotAdvanceLedger() {
        when(deliveryService.createDurableReminder(
            eq(11L), anyString(), anyString(), eq(VisitReminderSubtype.VISIT_STREAK_REMINDER)))
            .thenThrow(new IllegalStateException("database unavailable"));
        assertThrows(IllegalStateException.class,
            () -> serviceAt("2026-09-12T01:30:00Z").processSetting(7L, null));
        assertNull(setting.getLastCycleReminderStart());
    }

    @Test
    void noEligibleDurableRecipientLeavesLedgerUnset() {
        when(deliveryService.createDurableReminder(
            eq(11L), anyString(), anyString(), eq(VisitReminderSubtype.VISIT_STREAK_REMINDER)))
            .thenReturn(false);
        serviceAt("2026-09-12T01:30:00Z").processSetting(7L, null);
        assertNull(setting.getLastCycleReminderStart());
    }

    private VisitReminderService serviceAt(String instant) {
        return new VisitReminderService(settingsRepository, visitRepository, new VisitStreakCalculator(),
            deliveryService, properties, Clock.fixed(Instant.parse(instant), VisitStreakCalculator.ICT));
    }
}
