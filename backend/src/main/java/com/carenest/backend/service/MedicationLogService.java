package com.carenest.backend.service;

import com.carenest.backend.dto.medication.MedicationLogRequest;
import com.carenest.backend.dto.medication.MedicationLogResponse;
import com.carenest.backend.entity.Medication;
import com.carenest.backend.entity.MedicationLog;
import com.carenest.backend.exception.NotFoundException;
import com.carenest.backend.repository.MedicationLogRepository;
import com.carenest.backend.repository.MedicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class MedicationLogService {

    private final MedicationLogRepository medicationLogRepository;
    private final MedicationRepository medicationRepository;

    public MedicationLogResponse create(MedicationLogRequest request) {
        Medication medication = medicationRepository.findByIdAndDeletedAtIsNull(request.getMedicationId())
            .orElseThrow(() -> new NotFoundException("Medication not found: " + request.getMedicationId()));

        MedicationLog log = MedicationLog.builder()
            .medication(medication)
            .status(request.getStatus())
            .takenAt(request.getTakenAt() != null ? request.getTakenAt() : OffsetDateTime.now())
            .notes(request.getNotes())
            .build();

        MedicationLog saved = medicationLogRepository.save(log);

        if (medication.getSchedule() != null && medication.getSchedule().getTimes() != null) {
            medication.setNextDoseTime(calculateNextDoseTime(medication));
            medicationRepository.save(medication);
        }

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<MedicationLogResponse> getByElderlyId(Long elderlyId, OffsetDateTime from, OffsetDateTime to) {
        return medicationLogRepository.findAllByElderlyIdAndDateRange(elderlyId, from, to)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MedicationLogResponse> getByMedicationId(Long medicationId, OffsetDateTime from, OffsetDateTime to) {
        return medicationLogRepository.findByMedicationIdAndTakenAtBetweenOrderByTakenAtDesc(medicationId, from, to)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MedicationLogResponse getById(Long id) {
        MedicationLog log = medicationLogRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("MedicationLog not found: " + id));
        return toResponse(log);
    }

    private MedicationLogResponse toResponse(MedicationLog ml) {
        return MedicationLogResponse.builder()
            .id(ml.getId())
            .medicationId(ml.getMedication().getId())
            .medicationName(ml.getMedication().getName())
            .dosage(ml.getMedication().getDosage())
            .takenAt(ml.getTakenAt())
            .status(ml.getStatus())
            .notes(ml.getNotes())
            .createdAt(ml.getCreatedAt())
            .build();
    }

    private OffsetDateTime calculateNextDoseTime(Medication medication) {
        var schedule = medication.getSchedule();
        if (schedule == null || schedule.getTimes() == null || schedule.getTimes().isEmpty()) {
            return null;
        }

        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        ZonedDateTime now = ZonedDateTime.now(zone);
        List<String> times = schedule.getTimes();
        List<Integer> daysOfWeek = schedule.getDaysOfWeek();

        for (int dayOffset = 0; dayOffset < 7; dayOffset++) {
            ZonedDateTime candidateDay = now.plusDays(dayOffset);
            int dayValue = candidateDay.getDayOfWeek().getValue();

            if (daysOfWeek != null && !daysOfWeek.isEmpty() && !daysOfWeek.contains(dayValue)) {
                continue;
            }

            for (String timeStr : times) {
                LocalTime time = LocalTime.parse(timeStr);
                ZonedDateTime candidate = candidateDay.with(time);
                if (candidate.isAfter(now)) {
                    return candidate.toOffsetDateTime();
                }
            }
        }

        return null;
    }
}
