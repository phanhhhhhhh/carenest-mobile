package com.carenest.backend.scheduler;

import com.carenest.backend.entity.Notification;
import com.carenest.backend.entity.NotificationType;
import com.carenest.backend.entity.Reminder;
import com.carenest.backend.entity.User;
import com.carenest.backend.repository.NotificationRepository;
import com.carenest.backend.service.FcmService;
import com.carenest.backend.service.ReminderService;
import com.carenest.backend.service.SchedulerStateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReminderScheduler {

    private static final String JOB_NAME = "reminder_scheduler";

    private final ReminderService reminderService;
    private final NotificationRepository notificationRepository;
    private final FcmService fcmService;
    private final SchedulerStateService schedulerStateService;

    @Scheduled(cron = "0 * * * * *")
    @Transactional
    public void processDueReminders() {
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime from = schedulerStateService.getLastRunAndAdvance(JOB_NAME, now, Duration.ofMinutes(5));
        OffsetDateTime window = now.plusMinutes(5);

        List<Reminder> dueReminders = reminderService.findDueReminders(from, window);

        for (Reminder reminder : dueReminders) {
            if (reminder.getElderly().getNotificationPreferences() != null
                && reminder.getElderly().getNotificationPreferences().isInQuietHours()) {
                reminder.setRemindAt(now.plusMinutes(1));
                reminderService.save(reminder);
                log.debug("Deferred reminder {} — within quiet hours for userId={}",
                    reminder.getId(), reminder.getElderly().getId());
                continue;
            }

            if (isMedicationReminderEnabled(reminder.getElderly())) {
                Notification notification = Notification.builder()
                    .user(reminder.getElderly())
                    .type(NotificationType.MEDICATION_REMINDER)
                    .title("Reminder: " + reminder.getTitle())
                    .body("Time for: " + reminder.getTitle())
                    .data(Map.of(
                        "reminderId", reminder.getId(),
                        "elderlyId", reminder.getElderly().getId()
                    ))
                    .build();
                notificationRepository.save(notification);

                fcmService.sendToUser(reminder.getElderly().getId(),
                    "Reminder: " + reminder.getTitle(),
                    "Time for: " + reminder.getTitle(),
                    Map.of(
                        "type", "REMINDER",
                        "reminderId", reminder.getId().toString()
                    ));

                log.debug("Created reminder notification for elderly={} title={}",
                    reminder.getElderly().getId(), reminder.getTitle());
            }

            reminderService.updateNextRemindAt(reminder);
        }

        if (!dueReminders.isEmpty()) {
            log.info("Processed {} due reminders", dueReminders.size());
        }
    }

    // Fail open: a user who never touched their notification settings (or whose
    // preferences record is null/missing) should still receive reminders.
    private boolean isMedicationReminderEnabled(User user) {
        return user.getNotificationPreferences() == null || user.getNotificationPreferences().isMedicationReminder();
    }
}
