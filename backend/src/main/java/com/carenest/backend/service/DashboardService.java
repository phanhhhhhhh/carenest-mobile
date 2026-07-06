package com.carenest.backend.service;

import com.carenest.backend.dto.appointment.AppointmentResponse;
import com.carenest.backend.dto.dashboard.ActiveAlertSummary;
import com.carenest.backend.dto.dashboard.ElderlyDashboardItem;
import com.carenest.backend.dto.dashboard.FamilyDashboardResponse;
import com.carenest.backend.dto.dashboard.LatestMetricItem;
import com.carenest.backend.dto.dashboard.MedicationAdherenceSummary;
import com.carenest.backend.entity.Appointment;
import com.carenest.backend.entity.AppointmentStatus;
import com.carenest.backend.entity.ElderlyProfile;
import com.carenest.backend.entity.FamilyLink;
import com.carenest.backend.entity.FamilyLinkStatus;
import com.carenest.backend.entity.HealthMetricType;
import com.carenest.backend.entity.MedicationLog;
import com.carenest.backend.entity.MedicationLogStatus;
import com.carenest.backend.entity.Notification;
import com.carenest.backend.entity.User;
import com.carenest.backend.repository.AppointmentRepository;
import com.carenest.backend.repository.ElderlyProfileRepository;
import com.carenest.backend.repository.FamilyLinkRepository;
import com.carenest.backend.repository.HealthMetricRepository;
import com.carenest.backend.repository.MedicationLogRepository;
import com.carenest.backend.repository.MedicationRepository;
import com.carenest.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final FamilyLinkRepository familyLinkRepository;
    private final ElderlyProfileRepository elderlyProfileRepository;
    private final HealthMetricRepository healthMetricRepository;
    private final MedicationRepository medicationRepository;
    private final MedicationLogRepository medicationLogRepository;
    private final AppointmentRepository appointmentRepository;
    private final NotificationRepository notificationRepository;
    private final com.carenest.backend.repository.EmergencyEventRepository emergencyEventRepository;

    public FamilyDashboardResponse getFamilyDashboard(Long familyId) {
        List<FamilyLink> links = familyLinkRepository
            .findAllElderlyByFamilyIdAndStatus(familyId, FamilyLinkStatus.ACTIVE);

        List<ElderlyDashboardItem> items = new ArrayList<>();
        int totalAlerts = 0;
        int totalAppointments = 0;
        int totalMedsDue = 0;

        for (FamilyLink link : links) {
            User elderly = link.getElderly();
            ElderlyDashboardItem item = buildElderlyItem(elderly);
            items.add(item);

            totalAlerts += item.getActiveAlerts().getCount();
            totalAppointments += item.getUpcomingAppointments().size();
            totalMedsDue += (int) item.getMedicationAdherence().getTotalDue();
        }

        return FamilyDashboardResponse.builder()
            .familyId(familyId)
            .elderly(items)
            .summary(FamilyDashboardResponse.DashboardSummary.builder()
                .totalElderly(items.size())
                .totalActiveAlerts(totalAlerts)
                .totalUpcomingAppointments(totalAppointments)
                .totalMedicationsDue(totalMedsDue)
                .build())
            .build();
    }

    private ElderlyDashboardItem buildElderlyItem(User elderly) {
        Long elderlyId = elderly.getId();
        MedicationAdherenceSummary adherence = getMedicationAdherence(elderlyId);
        ActiveAlertSummary alerts = getActiveAlerts(elderlyId);

        // UC-22: Compute color-coded status for multi-elderly dashboard
        String statusColor;
        String statusMessage;
        if (alerts.getCount() > 0 && hasEmergencyAlert(elderlyId)) {
            statusColor = "RED";
            statusMessage = "Emergency alert active";
        } else if (alerts.getCount() > 3 || adherence.getAdherenceRate() < 0.7) {
            statusColor = "RED";
            statusMessage = "Needs immediate attention";
        } else if (alerts.getCount() > 0 || adherence.getAdherenceRate() < 0.9) {
            statusColor = "YELLOW";
            statusMessage = "Some items need attention";
        } else {
            statusColor = "GREEN";
            statusMessage = "All good";
        }

        return ElderlyDashboardItem.builder()
            .elderlyId(elderlyId)
            .elderlyName(elderly.getName())
            .healthConditions(getHealthConditions(elderlyId))
            .latestMetrics(getLatestMetrics(elderlyId))
            .medicationAdherence(adherence)
            .upcomingAppointments(getUpcomingAppointments(elderlyId))
            .activeAlerts(alerts)
            .statusColor(statusColor)
            .statusMessage(statusMessage)
            .build();
    }

    /**
     * Check if this elderly has any active (unresolved) emergency events.
     */
    private boolean hasEmergencyAlert(Long elderlyId) {
        return !emergencyEventRepository
            .findByElderlyIdAndStatusOrderByTriggeredAtDesc(elderlyId,
                com.carenest.backend.entity.EmergencyStatus.ACTIVE)
            .isEmpty();
    }

    private List<String> getHealthConditions(Long elderlyId) {
        return elderlyProfileRepository.findByUserIdAndDeletedAtIsNull(elderlyId)
            .map(ElderlyProfile::getHealthConditions)
            .orElse(Collections.emptyList());
    }

    // ── Latest Metrics ──────────────────────────────────────────────────────

    private Map<String, LatestMetricItem> getLatestMetrics(Long elderlyId) {
        Map<String, LatestMetricItem> metrics = new LinkedHashMap<>();
        for (HealthMetricType type : HealthMetricType.values()) {
            healthMetricRepository.findLatestByElderlyIdAndType(elderlyId, type)
                .ifPresent(m -> metrics.put(type.name(), LatestMetricItem.builder()
                    .value(m.getValue())
                    .valueSecondary(m.getValueSecondary())
                    .unit(m.getUnit())
                    .recordedAt(m.getRecordedAt())
                    .build()));
        }
        return metrics;
    }

    // ── Medication Adherence (today) ────────────────────────────────────────

    private MedicationAdherenceSummary getMedicationAdherence(Long elderlyId) {
        OffsetDateTime startOfDay = OffsetDateTime.now()
            .withHour(0).withMinute(0).withSecond(0).withNano(0);
        OffsetDateTime endOfDay = startOfDay.plusDays(1);

        // Count scheduled medications for today
        List<com.carenest.backend.entity.Medication> todayMeds = medicationRepository
            .findUpcomingByElderlyId(elderlyId, startOfDay, endOfDay);
        // Also count overdue
        List<com.carenest.backend.entity.Medication> overdue = medicationRepository
            .findAllOverdueMedications(OffsetDateTime.now())
            .stream()
            .filter(m -> m.getElderly().getId().equals(elderlyId))
            .collect(Collectors.toList());

        long totalDue = todayMeds.size() + overdue.size();

        // Get all logs for today
        List<MedicationLog> logs = medicationLogRepository
            .findAllByElderlyIdAndDateRange(elderlyId, startOfDay, endOfDay);

        long taken = logs.stream()
            .filter(l -> l.getStatus() == MedicationLogStatus.TAKEN).count();
        long missed = logs.stream()
            .filter(l -> l.getStatus() == MedicationLogStatus.MISSED).count();
        long skipped = logs.stream()
            .filter(l -> l.getStatus() == MedicationLogStatus.SKIPPED).count();

        double rate = totalDue > 0 ? (double) taken / totalDue : 1.0;

        return MedicationAdherenceSummary.builder()
            .totalDue(totalDue)
            .taken(taken)
            .missed(missed)
            .skipped(skipped)
            .adherenceRate(Math.min(rate, 1.0))
            .build();
    }

    // ── Upcoming Appointments ───────────────────────────────────────────────

    private List<AppointmentResponse> getUpcomingAppointments(Long elderlyId) {
        OffsetDateTime now = OffsetDateTime.now();
        return appointmentRepository
            .findByElderlyIdAndDatetimeBetweenAndDeletedAtIsNullOrderByDatetimeAsc(
                elderlyId, now, now.plusMonths(3))
            .stream()
            .filter(a -> a.getStatus() == AppointmentStatus.SCHEDULED)
            .map(this::toAppointmentResponse)
            .limit(5)
            .collect(Collectors.toList());
    }

    // ── Active Alerts ───────────────────────────────────────────────────────

    private ActiveAlertSummary getActiveAlerts(Long elderlyId) {
        long unreadCount = notificationRepository.countByUserIdAndReadAtIsNull(elderlyId);

        String latestTitle = null;
        String latestType = null;
        var page = notificationRepository
            .findByUserIdOrderByCreatedAtDesc(elderlyId, PageRequest.of(0, 1));
        if (!page.isEmpty()) {
            Notification latest = page.getContent().get(0);
            latestTitle = latest.getTitle();
            latestType = latest.getType().name();
        }

        return ActiveAlertSummary.builder()
            .count((int) unreadCount)
            .latestTitle(latestTitle)
            .latestType(latestType)
            .build();
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private AppointmentResponse toAppointmentResponse(Appointment a) {
        return AppointmentResponse.builder()
            .id(a.getId())
            .elderlyId(a.getElderly().getId())
            .elderlyName(a.getElderly().getName())
            .doctor(a.getDoctor())
            .specialty(a.getSpecialty())
            .location(a.getLocation())
            .datetime(a.getDatetime())
            .notes(a.getNotes())
            .status(a.getStatus())
            .createdAt(a.getCreatedAt())
            .updatedAt(a.getUpdatedAt())
            .build();
    }
}
