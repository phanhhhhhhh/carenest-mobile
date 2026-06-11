package com.carenest.backend.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
}
