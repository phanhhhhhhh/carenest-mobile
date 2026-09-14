package com.carenest.backend.entity;

import org.junit.jupiter.api.Test;

import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NotificationPreferencesTest {

    @Test
    void overnightRangeIsStartInclusiveAndEndExclusive() {
        NotificationPreferences preferences = NotificationPreferences.builder()
            .quietHoursStart("22:00").quietHoursEnd("07:00").build();
        assertTrue(preferences.isInQuietHours(LocalTime.of(22, 0)));
        assertTrue(preferences.isInQuietHours(LocalTime.of(6, 59)));
        assertFalse(preferences.isInQuietHours(LocalTime.of(7, 0)));
        assertFalse(preferences.isInQuietHours(LocalTime.of(12, 0)));
    }

    @Test
    void daytimeRangeIsStartInclusiveAndEndExclusive() {
        NotificationPreferences preferences = NotificationPreferences.builder()
            .quietHoursStart("08:00").quietHoursEnd("10:00").build();
        assertTrue(preferences.isInQuietHours(LocalTime.of(8, 0)));
        assertTrue(preferences.isInQuietHours(LocalTime.of(9, 59)));
        assertFalse(preferences.isInQuietHours(LocalTime.of(10, 0)));
        assertFalse(preferences.isInQuietHours(LocalTime.of(7, 59)));
    }

    @Test
    void equalOrInvalidTimesDoNotCreatePermanentQuietHours() {
        NotificationPreferences preferences = NotificationPreferences.builder()
            .quietHoursStart("08:00").quietHoursEnd("08:00").build();
        assertFalse(preferences.isInQuietHours(LocalTime.NOON));
        preferences.setQuietHoursStart("invalid");
        assertFalse(preferences.isInQuietHours(LocalTime.NOON));
    }
}
