package com.carenest.backend.scheduler;

import com.carenest.backend.entity.FamilyLinkStatus;
import com.carenest.backend.entity.Medication;
import com.carenest.backend.entity.MedicationLog;
import com.carenest.backend.entity.MedicationLogStatus;
import com.carenest.backend.entity.Notification;
import com.carenest.backend.entity.NotificationType;
import com.carenest.backend.entity.User;
import com.carenest.backend.repository.FamilyLinkRepository;
import com.carenest.backend.repository.MedicationLogRepository;
import com.carenest.backend.repository.MedicationRepository;
import com.carenest.backend.repository.NotificationRepository;
import com.carenest.backend.service.FcmService;
import com.carenest.backend.service.MedicationScheduleCalculator;
import com.carenest.backend.service.SchedulerStateService;
import com.carenest.backend.service.SubscriptionService;

import java.util.HashMap;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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
public class MedicationReminderScheduler {

    private static final String JOB_NAME = "medication_reminder_scheduler";

    private final MedicationRepository medicationRepository;
    private final MedicationLogRepository medicationLogRepository;
    private final NotificationRepository notificationRepository;
    private final FcmService fcmService;
    private final com.carenest.backend.service.ChatReminderService chatReminderService;
    private final SchedulerStateService schedulerStateService;
    private final FamilyLinkRepository familyLinkRepository;
    private final SubscriptionService subscriptionService;

    /** Minutes after a scheduled dose before an unconfirmed dose is logged MISSED (UC B2). */
    @Value("${carenest.medication.missed-grace-minutes:90}")
    private long missedGraceMinutes;

    @Scheduled(cron = "0 * * * * *")
    @Transactional
    public void checkDueMedications() {
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime from = schedulerStateService.getLastRunAndAdvance(JOB_NAME, now, Duration.ofHours(1));

        List<Medication> dueMedications = medicationRepository
            .findByNextDoseTimeBetweenAndDeletedAtIsNull(from, now);

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
                .existsLogForMedicationInWindow(med.getId(), from, now);

            if (!alreadyLogged) {
                if (isMedicationReminderEnabled(med.getElderly())) {
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

                    Map<String, String> fcmData = new HashMap<>();
                    fcmData.put("type", "MEDICATION_REMINDER");
                    fcmData.put("medicationId", med.getId().toString());
                    // UC B2: a family-recorded reminder voice only plays on Family Plus.
                    if (med.getVoiceUrl() != null && !med.getVoiceUrl().isBlank()
                        && hasPremiumFamily(med.getElderly().getId())) {
                        fcmData.put("voiceUrl", med.getVoiceUrl());
                    }
                    fcmService.sendToUser(med.getElderly().getId(),
                        "Medication Reminder: " + med.getName(),
                        med.getName() + " - " + med.getDosage(),
                        fcmData);

                    try {
                        chatReminderService.sendMedicationChatReminder(med.getElderly(), med);
                    } catch (Exception e) {
                        log.warn("Failed to send chat reminder for medication {}: {}", med.getId(), e.getMessage());
                    }

                    log.debug("Medication reminder: elderly={} medication={}",
                        med.getElderly().getId(), med.getName());
                }
            }

            // Advance to the next scheduled slot now that this one has fired.
            // Without this, a dose the elderly never logs leaves nextDoseTime in
            // the past forever and no future reminder ever goes out — logging a
            // dose was previously the only thing that recalculated it.
            OffsetDateTime next = MedicationScheduleCalculator.nextDoseTime(med.getSchedule());
            if (next != null) {
                med.setNextDoseTime(next);
                medicationRepository.save(med);
            }
        }

        if (!dueMedications.isEmpty()) {
            log.info("Medication check: {} due medications checked", dueMedications.size());
        }
    }

    // Fail open: a user who never touched their notification settings (or whose
    // preferences record is null/missing) should still receive reminders.
    private boolean isMedicationReminderEnabled(User user) {
        return user.getNotificationPreferences() == null || user.getNotificationPreferences().isMedicationReminder();
    }

    /** True when at least one linked family member has an active Family Plus plan. */
    private boolean hasPremiumFamily(Long elderlyId) {
        return familyLinkRepository.findAllFamilyByElderlyIdAndStatus(elderlyId, FamilyLinkStatus.ACTIVE)
            .stream()
            .anyMatch(link -> subscriptionService.isPremium(link.getFamily().getId()));
    }

    /**
     * UC B2: a scheduled dose the elderly never confirmed within the grace window
     * is recorded MISSED, so the Feed, digest and adherence stats reflect it.
     */
    @Scheduled(cron = "0 */15 * * * *")
    @Transactional
    public void sweepMissedDoses() {
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime graceCutoff = now.minusMinutes(missedGraceMinutes);
        OffsetDateTime lookbackLimit = now.minusHours(12);

        for (Medication med : medicationRepository.findAll()) {
            if (med.getDeletedAt() != null || med.getSchedule() == null) {
                continue;
            }
            OffsetDateTime lastSlot = MedicationScheduleCalculator.previousDoseTime(med.getSchedule());
            if (lastSlot == null || lastSlot.isAfter(graceCutoff) || lastSlot.isBefore(lookbackLimit)) {
                continue;
            }
            boolean logged = medicationRepository.existsLogForMedicationInWindow(
                med.getId(), lastSlot.minusMinutes(30), lastSlot.plusHours(6));
            if (logged) {
                continue;
            }
            medicationLogRepository.save(MedicationLog.builder()
                .medication(med)
                .status(MedicationLogStatus.MISSED)
                .takenAt(lastSlot)
                .notes("Auto: chưa xác nhận trong " + missedGraceMinutes + " phút")
                .build());
            log.info("Recorded MISSED dose: medicationId={} slot={}", med.getId(), lastSlot);
        }
    }
}
