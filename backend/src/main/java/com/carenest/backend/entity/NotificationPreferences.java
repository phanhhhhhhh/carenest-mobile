package com.carenest.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreferences {
    @Builder.Default private boolean medicationReminder = true;
    @Builder.Default private int reminderMinutesBefore = 10;
    @Builder.Default private boolean healthAlert = true;
    @Builder.Default private boolean familyUpdate = true;
    @Builder.Default private String quietHoursStart = "22:00";
    @Builder.Default private String quietHoursEnd = "07:00";

    /**
     * Returns true if the current time falls within the configured quiet hours.
     * Handles overnight ranges (e.g., 22:00 to 07:00).
     */
    @JsonIgnore
    public boolean isInQuietHours() {
        if (quietHoursStart == null || quietHoursEnd == null) {
            return false;
        }
        try {
            LocalTime now = LocalTime.now();
            LocalTime start = LocalTime.parse(quietHoursStart);
            LocalTime end = LocalTime.parse(quietHoursEnd);

            if (start.isBefore(end)) {
                // Same-day range: e.g., 01:00 to 05:00
                return !now.isBefore(start) && now.isBefore(end);
            } else {
                // Overnight range: e.g., 22:00 to 07:00
                return !now.isBefore(start) || now.isBefore(end);
            }
        } catch (Exception e) {
            return false; // invalid format → don't block
        }
    }
}