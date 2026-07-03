package com.carenest.backend.scheduler;

import com.carenest.backend.entity.Notification;
import com.carenest.backend.entity.NotificationType;
import com.carenest.backend.entity.Reminder;
import com.carenest.backend.repository.NotificationRepository;
import com.carenest.backend.service.FcmService;
import com.carenest.backend.service.ReminderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReminderScheduler {

    private final ReminderService reminderService;
    private final NotificationRepository notificationRepository;
    private final FcmService fcmService;

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void processDueReminders() {
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime window = now.plusMinutes(5);

        List<Reminder> dueReminders = reminderService.findDueReminders(now, window);

        for (Reminder reminder : dueReminders) {
            Notification notification = Notification.builder()
                .user(reminder.getElderly())
                .type(NotificationType.MEDICATION_REMINDER)
                .title("Nhắc nhở: " + reminder.getTitle())
                .body("Đã đến giờ: " + reminder.getTitle())
                .data(java.util.Map.of(
                    "reminderId", reminder.getId(),
                    "elderlyId", reminder.getElderly().getId()
                ))
                .build();
            notificationRepository.save(notification);

            // Send push notification to the elderly user
            fcmService.sendToUser(reminder.getElderly().getId(),
                "Nhắc nhở: " + reminder.getTitle(),
                "Đã đến giờ: " + reminder.getTitle(),
                Map.of(
                    "type", "REMINDER",
                    "reminderId", reminder.getId().toString()
                ));

            log.debug("Created reminder notification for elderly={} title={}",
                reminder.getElderly().getId(), reminder.getTitle());

            // Schedule next occurrence for recurring reminders
            reminderService.updateNextRemindAt(reminder);
        }

        if (!dueReminders.isEmpty()) {
            log.info("Processed {} due reminders", dueReminders.size());
        }
    }
}
