package com.carenest.backend.dto.user;

import com.carenest.backend.entity.NotificationPreferences;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NotificationPreferencesResponse {

    private boolean medicationReminder;
    private int reminderMinutesBefore;
    private boolean healthAlert;
    private boolean familyUpdate;
    private String quietHoursStart;
    private String quietHoursEnd;

    public static NotificationPreferencesResponse from(NotificationPreferences prefs) {
        return NotificationPreferencesResponse.builder()
            .medicationReminder(prefs.isMedicationReminder())
            .reminderMinutesBefore(prefs.getReminderMinutesBefore())
            .healthAlert(prefs.isHealthAlert())
            .familyUpdate(prefs.isFamilyUpdate())
            .quietHoursStart(prefs.getQuietHoursStart())
            .quietHoursEnd(prefs.getQuietHoursEnd())
            .build();
    }
}
