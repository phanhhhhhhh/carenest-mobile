package com.carenest.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;
import java.time.ZoneId;

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

    
    @JsonIgnore
    public boolean isInQuietHours() {
        return isInQuietHours(LocalTime.now(ZoneId.of("Asia/Ho_Chi_Minh")));
    }

    @JsonIgnore
    public boolean isInQuietHours(LocalTime now) {
        if (quietHoursStart == null || quietHoursEnd == null) {
            return false;
        }
        try {
            LocalTime start = LocalTime.parse(quietHoursStart);
            LocalTime end = LocalTime.parse(quietHoursEnd);

            if (start.isBefore(end)) {
                return !now.isBefore(start) && now.isBefore(end);
            } else if (start.isAfter(end)) {
                return !now.isBefore(start) || now.isBefore(end);
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }
}
