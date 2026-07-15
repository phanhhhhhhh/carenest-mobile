package com.carenest.backend.security;

import com.carenest.backend.entity.FamilyLinkStatus;
import com.carenest.backend.repository.AppointmentRepository;
import com.carenest.backend.repository.ElderlyProfileRepository;
import com.carenest.backend.repository.EmergencyEventRepository;
import com.carenest.backend.repository.FamilyLinkRepository;
import com.carenest.backend.repository.HealthMetricRepository;
import com.carenest.backend.repository.HealthMetricThresholdRepository;
import com.carenest.backend.repository.MedicationLogRepository;
import com.carenest.backend.repository.MedicationRepository;
import com.carenest.backend.repository.NotificationRepository;
import com.carenest.backend.repository.CameraDeviceRepository;
import com.carenest.backend.repository.ReminderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service("authz")
@RequiredArgsConstructor
public class AuthorizationService {

    private final ElderlyProfileRepository elderlyProfileRepository;
    private final FamilyLinkRepository familyLinkRepository;
    private final MedicationRepository medicationRepository;
    private final HealthMetricRepository healthMetricRepository;
    private final EmergencyEventRepository emergencyEventRepository;
    private final MedicationLogRepository medicationLogRepository;
    private final AppointmentRepository appointmentRepository;
    private final NotificationRepository notificationRepository;
    private final ReminderRepository reminderRepository;
    private final HealthMetricThresholdRepository healthMetricThresholdRepository;
    private final CameraDeviceRepository cameraDeviceRepository;

    public boolean isOwnerOrLinkedFamily(Long principalId, Long elderlyId) {
        if (principalId == null || elderlyId == null) return false;
        if (principalId.equals(elderlyId)) return true;
        return familyLinkRepository.existsByElderlyIdAndFamilyIdAndStatusAndDeletedAtIsNull(
            elderlyId, principalId, FamilyLinkStatus.ACTIVE);
    }

    public boolean canAccessElderlyProfile(Long principalId, Long profileId) {
        if (principalId == null || profileId == null) return false;
        return elderlyProfileRepository.findByIdAndDeletedAtIsNull(profileId)
            .map(p -> isOwnerOrLinkedFamily(principalId, p.getUser().getId()))
            .orElse(false);
    }

    public boolean isFamilyLinkParticipant(Long principalId, Long linkId) {
        if (principalId == null || linkId == null) return false;
        return familyLinkRepository.findByIdAndDeletedAtIsNull(linkId)
            .map(l -> principalId.equals(l.getElderly().getId()) ||
                      principalId.equals(l.getFamily().getId()))
            .orElse(false);
    }

    public boolean canAccessMedication(Long principalId, Long medicationId) {
        if (principalId == null || medicationId == null) return false;
        return medicationRepository.findByIdAndDeletedAtIsNull(medicationId)
            .map(m -> isOwnerOrLinkedFamily(principalId, m.getElderly().getId()))
            .orElse(false);
    }

    public boolean canAccessHealthMetric(Long principalId, Long metricId) {
        if (principalId == null || metricId == null) return false;
        return healthMetricRepository.findByIdAndDeletedAtIsNull(metricId)
            .map(m -> isOwnerOrLinkedFamily(principalId, m.getElderly().getId()))
            .orElse(false);
    }

    public boolean canAccessEmergencyEvent(Long principalId, Long eventId) {
        if (principalId == null || eventId == null) return false;
        return emergencyEventRepository.findById(eventId)
            .map(e -> isOwnerOrLinkedFamily(principalId, e.getElderly().getId()))
            .orElse(false);
    }

    public boolean canAccessMedicationLog(Long principalId, Long logId) {
        if (principalId == null || logId == null) return false;
        return medicationLogRepository.findById(logId)
            .map(log -> isOwnerOrLinkedFamily(principalId, log.getMedication().getElderly().getId()))
            .orElse(false);
    }

    public boolean canAccessAppointment(Long principalId, Long appointmentId) {
        if (principalId == null || appointmentId == null) return false;
        return appointmentRepository.findById(appointmentId)
            .filter(a -> a.getDeletedAt() == null)
            .map(a -> isOwnerOrLinkedFamily(principalId, a.getElderly().getId()))
            .orElse(false);
    }

    public boolean canAccessNotification(Long principalId, Long notificationId) {
        if (principalId == null || notificationId == null) return false;
        return notificationRepository.findById(notificationId)
            .map(n -> isOwnerOrLinkedFamily(principalId, n.getUser().getId()))
            .orElse(false);
    }

    public boolean canAccessReminder(Long principalId, Long reminderId) {
        if (principalId == null || reminderId == null) return false;
        return reminderRepository.findById(reminderId)
            .filter(r -> r.getDeletedAt() == null)
            .map(r -> isOwnerOrLinkedFamily(principalId, r.getElderly().getId()))
            .orElse(false);
    }

    public boolean canAccessHealthThreshold(Long principalId, Long thresholdId) {
        if (principalId == null || thresholdId == null) return false;
        return healthMetricThresholdRepository.findById(thresholdId)
            .map(t -> isOwnerOrLinkedFamily(principalId, t.getElderly().getId()))
            .orElse(false);
    }

    
    public boolean canAccessCamera(Long principalId, Long cameraId) {
        if (principalId == null || cameraId == null) return false;
        return cameraDeviceRepository.findById(cameraId)
            .map(c -> isOwnerOrLinkedFamily(principalId, c.getElderly().getId()))
            .orElse(false);
    }
}