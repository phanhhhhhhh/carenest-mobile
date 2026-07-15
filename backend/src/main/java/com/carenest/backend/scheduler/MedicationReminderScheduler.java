package com.carenest.backend.scheduler;

import com.carenest.backend.entity.Medication;
import com.carenest.backend.entity.Notification;
import com.carenest.backend.entity.NotificationType;
import com.carenest.backend.repository.MedicationRepository;
import com.carenest.backend.repository.NotificationRepository;
import com.carenest.backend.service.FcmService;
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
public class MedicationReminderScheduler {

    private final MedicationRepository medicationRepository;
    private final NotificationRepository notificationRepository;
    private final FcmService fcmService;
    private final com.carenest.backend.service.ChatReminderService chatReminderService;

    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void checkDueMedications() {
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime oneHourAgo = now.minusHours(1);

        List<Medication> dueMedications = medicationRepository
            .findByNextDoseTimeBetweenAndDeletedAtIsNull(oneHourAgo, now);

        for (Medication med : dueMedications) {
            if (med.getElderly().getNotificationPreferences() != null
                && med.getElderly().getNotificationPreferences().isInQuietHours()) {
                med.setNextDoseTime(now.plusMinutes(30));
                medicationRepository.save(med);
                log.debug("Deferred medication reminder {} — within quiet hours for userId={}",
                    med.getId(), med.getElderly().getId());
                continue;
            }

            boolean alreadyLogged = medicationRepository
                .existsLogForMedicationInWindow(med.getId(), oneHourAgo, now);

            if (!alreadyLogged) {
                Notification notification = Notification.builder()
                    .user(med.getElderly())
                    .type(NotificationType.MEDICATION_REMINDER)
                    .title("Medication Reminder: " + med.getName())
                    .body("Time to take " + med.getName() + " - " + med.getDosage()
                        + ". " + (med.getInstructions() != null ? med.getInstructions() : ""))
                    .data(Map.of(
                        "medicationId", med.getId().toString(),
                        "elderlyId", med.getElderly().getId().toString(),
                        "name", med.getName()
                    ))
                    .build();
                notificationRepository.save(notification);

                fcmService.sendToUser(med.getElderly().getId(),
                    "Medication Reminder: " + med.getName(),
                    med.getName() + " - " + med.getDosage(),
                    Map.of(
                        "type", "MEDICATION_REMINDER",
                        "medicationId", med.getId().toString()
                    ));

                try {
                    chatReminderService.sendMedicationChatReminder(med.getElderly(), med);
                } catch (Exception e) {
                    log.warn("Failed to send chat reminder for medication {}: {}", med.getId(), e.getMessage());
                }

                log.debug("Medication reminder: elderly={} medication={}",
                    med.getElderly().getId(), med.getName());
            }
        }

        if (!dueMedications.isEmpty()) {
            log.info("Medication check: {} due medications checked", dueMedications.size());
        }
    }
}
