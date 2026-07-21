package com.carenest.backend.service;

import com.carenest.backend.dto.appointment.AppointmentResponse;
import com.carenest.backend.dto.dashboard.ActiveAlertSummary;
import com.carenest.backend.dto.dashboard.ElderlyDashboardItem;
import com.carenest.backend.dto.dashboard.FamilyDashboardResponse;
import com.carenest.backend.dto.dashboard.LatestMetricItem;
import com.carenest.backend.dto.dashboard.MedicationAdherenceSummary;
import com.carenest.backend.entity.Appointment;
import com.carenest.backend.entity.AppointmentStatus;
import com.carenest.backend.entity.EmergencyStatus;
import com.carenest.backend.entity.FamilyLink;
import com.carenest.backend.entity.FamilyLinkStatus;
import com.carenest.backend.entity.HealthMetric;
import com.carenest.backend.entity.Medication;
import com.carenest.backend.entity.MedicationLog;
import com.carenest.backend.entity.MedicationLogStatus;
import com.carenest.backend.entity.Notification;
import com.carenest.backend.entity.User;
import com.carenest.backend.repository.AppointmentRepository;
import com.carenest.backend.repository.ElderlyProfileRepository;
import com.carenest.backend.repository.EmergencyEventRepository;
import com.carenest.backend.repository.FamilyLinkRepository;
import com.carenest.backend.repository.HealthMetricRepository;
import com.carenest.backend.repository.MedicationLogRepository;
import com.carenest.backend.repository.MedicationRepository;
import com.carenest.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
    private final EmergencyEventRepository emergencyEventRepository;

    public FamilyDashboardResponse getFamilyDashboard(Long familyId) {
        List<FamilyLink> links = familyLinkRepository
                .findAllElderlyByFamilyIdAndStatus(familyId, FamilyLinkStatus.ACTIVE);

        if (links.isEmpty()) {
            return FamilyDashboardResponse.builder()
                    .familyId(familyId)
                    .elderly(Collections.emptyList())
                    .summary(FamilyDashboardResponse.DashboardSummary.builder()
                            .totalElderly(0)
                            .totalActiveAlerts(0)
                            .totalUpcomingAppointments(0)
                            .totalMedicationsDue(0)
                            .build())
                    .build();
        }

        List<Long> elderlyIds = links.stream()
                .map(link -> link.getElderly().getId())
                .collect(Collectors.toList());

        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime startOfDay = now.withHour(0).withMinute(0).withSecond(0).withNano(0);
        OffsetDateTime endOfDay = startOfDay.plusDays(1);

        Map<Long, List<String>> healthConditionsByElderly = elderlyProfileRepository
                .findByUserIdInAndDeletedAtIsNull(elderlyIds)
                .stream()
                .collect(Collectors.toMap(p -> p.getUser().getId(), p -> p.getHealthConditions()));

        Map<Long, Map<String, LatestMetricItem>> latestMetricsByElderly = healthMetricRepository
                .findLatestPerElderlyAndType(elderlyIds)
                .stream()
                .collect(Collectors.groupingBy(
                        hm -> hm.getElderly().getId(),
                        Collectors.toMap(
                                hm -> hm.getType().name(),
                                this::toLatestMetricItem,
                                (a, b) -> a,
                                LinkedHashMap::new)));

        Map<Long, List<Medication>> upcomingMedsByElderly = medicationRepository
                .findUpcomingByElderlyIds(elderlyIds, startOfDay, endOfDay)
                .stream()
                .collect(Collectors.groupingBy(m -> m.getElderly().getId()));

        Map<Long, List<Medication>> overdueMedsByElderly = medicationRepository
                .findOverdueByElderlyIds(elderlyIds, now)
                .stream()
                .collect(Collectors.groupingBy(m -> m.getElderly().getId()));

        Map<Long, List<MedicationLog>> logsByElderly = medicationLogRepository
                .findAllByElderlyIdsAndDateRange(elderlyIds, startOfDay, endOfDay)
                .stream()
                .collect(Collectors.groupingBy(l -> l.getMedication().getElderly().getId()));

        Map<Long, List<AppointmentResponse>> appointmentsByElderly = appointmentRepository
                .findByElderlyIdInAndDatetimeBetweenAndDeletedAtIsNullOrderByDatetimeAsc(
                        elderlyIds, now, now.plusMonths(3))
                .stream()
                .filter(a -> a.getStatus() == AppointmentStatus.SCHEDULED)
                .collect(Collectors.groupingBy(a -> a.getElderly().getId()))
                .entrySet()
                .stream()
                .collect(Collectors.toMap(
                        e -> e.getKey(),
                        e -> e.getValue().stream()
                                .map(this::toAppointmentResponse)
                                .limit(5)
                                .collect(Collectors.toList())));

        Map<Long, Long> unreadCountByElderly = new HashMap<>();
        for (Object[] row : notificationRepository.countUnreadByUserIds(elderlyIds)) {
            unreadCountByElderly.put((Long) row[0], (Long) row[1]);
        }

        Map<Long, Notification> latestNotificationByElderly = notificationRepository
                .findLatestPerUser(elderlyIds)
                .stream()
                .collect(Collectors.toMap(n -> n.getUser().getId(), n -> n));

        Set<Long> elderlyWithActiveEmergency = emergencyEventRepository
                .findByElderlyIdInAndStatus(elderlyIds, EmergencyStatus.ACTIVE)
                .stream()
                .map(e -> e.getElderly().getId())
                .collect(Collectors.toCollection(HashSet::new));

        List<ElderlyDashboardItem> items = new ArrayList<>();
        int totalAlerts = 0;
        int totalAppointments = 0;
        int totalMedsDue = 0;

        for (FamilyLink link : links) {
            User elderly = link.getElderly();
            Long elderlyId = elderly.getId();

            MedicationAdherenceSummary adherence = buildMedicationAdherence(
                    upcomingMedsByElderly.getOrDefault(elderlyId, Collections.emptyList()),
                    overdueMedsByElderly.getOrDefault(elderlyId, Collections.emptyList()),
                    logsByElderly.getOrDefault(elderlyId, Collections.emptyList()));

            ActiveAlertSummary alerts = buildActiveAlerts(
                    unreadCountByElderly.getOrDefault(elderlyId, 0L),
                    latestNotificationByElderly.get(elderlyId));

            List<AppointmentResponse> upcomingAppointments =
                    appointmentsByElderly.getOrDefault(elderlyId, Collections.emptyList());

            boolean hasEmergency = elderlyWithActiveEmergency.contains(elderlyId);

            String statusColor;
            String statusMessage;
            if (alerts.getCount() > 0 && hasEmergency) {
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

            ElderlyDashboardItem item = ElderlyDashboardItem.builder()
                    .elderlyId(elderlyId)
                    .elderlyName(elderly.getName())
                    .healthConditions(healthConditionsByElderly.getOrDefault(elderlyId, Collections.emptyList()))
                    .latestMetrics(latestMetricsByElderly.getOrDefault(elderlyId, Collections.emptyMap()))
                    .medicationAdherence(adherence)
                    .upcomingAppointments(upcomingAppointments)
                    .activeAlerts(alerts)
                    .statusColor(statusColor)
                    .statusMessage(statusMessage)
                    .build();
            items.add(item);

            totalAlerts += alerts.getCount();
            totalAppointments += upcomingAppointments.size();
            totalMedsDue += (int) adherence.getTotalDue();
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

    private LatestMetricItem toLatestMetricItem(HealthMetric m) {
        return LatestMetricItem.builder()
                .value(m.getValue())
                .valueSecondary(m.getValueSecondary())
                .unit(m.getUnit())
                .recordedAt(m.getRecordedAt())
                .build();
    }

    private MedicationAdherenceSummary buildMedicationAdherence(
            List<Medication> todayMeds, List<Medication> overdue, List<MedicationLog> logs) {
        long totalDue = todayMeds.size() + overdue.size();

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

    private ActiveAlertSummary buildActiveAlerts(long unreadCount, Notification latest) {
        String latestTitle = latest != null ? latest.getTitle() : null;
        String latestType = latest != null ? latest.getType().name() : null;

        return ActiveAlertSummary.builder()
                .count((int) unreadCount)
                .latestTitle(latestTitle)
                .latestType(latestType)
                .build();
    }

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
