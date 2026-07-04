package com.carenest.backend.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreferencesRequest {

    private Boolean medicationReminder;
    private Integer reminderMinutesBefore;
    private Boolean healthAlert;
    private Boolean familyUpdate;
    private String quietHoursStart;
    private String quietHoursEnd;
}
