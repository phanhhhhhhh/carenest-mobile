package com.carenest.backend.scheduler;

import com.carenest.backend.entity.Appointment;
import com.carenest.backend.entity.AppointmentStatus;
import com.carenest.backend.entity.Notification;
import com.carenest.backend.entity.NotificationType;
import com.carenest.backend.repository.AppointmentRepository;
import com.carenest.backend.repository.NotificationRepository;
import com.carenest.backend.service.ChatReminderService;
import com.carenest.backend.service.FcmService;
import com.carenest.backend.service.SchedulerStateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Notifies the elderly ahead of upcoming appointments. Appointments are
 * created/edited on the family side only; the elderly side is read-only, so
 * this scheduler is what surfaces them to the elderly in time.
 *
 * Two reminders per appointment, each fired exactly once via the
 * scheduler-state window: when "datetime - offset" falls inside
 * (lastRun, now] the reminder is due. A day-ahead one and a same-day one.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AppointmentReminderScheduler {

    private static final String JOB_NAME = "appointment_reminder_scheduler";
    private static final ZoneId ICT = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm 'ngày' dd/MM");

    private static final Duration DAY_BEFORE = Duration.ofHours(24);
    private static final Duration HOURS_BEFORE = Duration.ofHours(2);

    private final AppointmentRepository appointmentRepository;
    private final NotificationRepository notificationRepository;
    private final FcmService fcmService;
    private final ChatReminderService chatReminderService;
    private final SchedulerStateService schedulerStateService;

    @Scheduled(cron = "30 * * * * *")
    @Transactional
    public void checkUpcomingAppointments() {
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime from = schedulerStateService.getLastRunAndAdvance(JOB_NAME, now, Duration.ofHours(1));

        List<Appointment> due = new ArrayList<>();
        // datetime - offset ∈ (from, now]  ⇔  datetime ∈ (from + offset, now + offset]
        due.addAll(appointmentRepository.findByStatusAndDatetimeBetweenAndDeletedAtIsNull(
            AppointmentStatus.SCHEDULED, from.plus(DAY_BEFORE), now.plus(DAY_BEFORE)));
        due.addAll(appointmentRepository.findByStatusAndDatetimeBetweenAndDeletedAtIsNull(
            AppointmentStatus.SCHEDULED, from.plus(HOURS_BEFORE), now.plus(HOURS_BEFORE)));

        for (Appointment apt : due) {
            boolean sameDay = !apt.getDatetime().isAfter(now.plus(HOURS_BEFORE));
            String when = apt.getDatetime().atZoneSameInstant(ICT).format(TIME_FMT);

            String title = sameDay
                ? "Sắp đến giờ khám: " + apt.getDoctor()
                : "Ngày mai có lịch khám: " + apt.getDoctor();
            String body = (apt.getSpecialty() != null ? apt.getSpecialty() + " · " : "")
                + when
                + (apt.getLocation() != null ? " · " + apt.getLocation() : "");

            Notification notification = Notification.builder()
                .user(apt.getElderly())
                .type(NotificationType.APPOINTMENT_REMINDER)
                .title(title)
                .body(body)
                .data(Map.of(
                    "appointmentId", apt.getId().toString(),
                    "elderlyId", apt.getElderly().getId().toString()
                ))
                .build();
            notificationRepository.save(notification);

            boolean quietHours = apt.getElderly().getNotificationPreferences() != null
                && apt.getElderly().getNotificationPreferences().isInQuietHours();
            if (!quietHours) {
                fcmService.sendToUser(apt.getElderly().getId(), title, body,
                    Map.of(
                        "type", "APPOINTMENT_REMINDER",
                        "appointmentId", apt.getId().toString()
                    ));

                try {
                    chatReminderService.sendAppointmentChatReminder(apt.getElderly(), apt);
                } catch (Exception e) {
                    log.warn("Failed to send chat reminder for appointment {}: {}", apt.getId(), e.getMessage());
                }
            }

            log.debug("Appointment reminder: elderly={} appointment={} sameDay={}",
                apt.getElderly().getId(), apt.getId(), sameDay);
        }

        if (!due.isEmpty()) {
            log.info("Appointment check: {} reminders sent", due.size());
        }
    }
}
