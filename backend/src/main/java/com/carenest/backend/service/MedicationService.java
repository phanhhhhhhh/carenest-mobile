package com.carenest.backend.service;

import com.carenest.backend.dto.medication.MedicationRequest;
import com.carenest.backend.dto.medication.MedicationResponse;
import com.carenest.backend.entity.Medication;
import com.carenest.backend.entity.MedicationSchedule;
import com.carenest.backend.entity.User;
import com.carenest.backend.exception.NotFoundException;
import com.carenest.backend.repository.MedicationRepository;
import com.carenest.backend.repository.UserRepository;
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
public class MedicationService {

    private final MedicationRepository medicationRepository;
    private final UserRepository userRepository;

    public MedicationResponse create(MedicationRequest request) {
        User elderly = userRepository.findById(request.getElderlyId())
            .orElseThrow(() -> new NotFoundException("User (elderly) not found: " + request.getElderlyId()));

        Medication medication = Medication.builder()
            .elderly(elderly)
            .name(request.getName())
            .dosage(request.getDosage())
            .schedule(request.getSchedule())
            .nextDoseTime(calculateNextDoseTime(request.getSchedule()))
            .instructions(request.getInstructions())
            .photoUrl(request.getPhotoUrl())
            .build();

        return toResponse(medicationRepository.save(medication));
    }

    @Transactional(readOnly = true)
    public List<MedicationResponse> getByElderlyId(Long elderlyId) {
        return medicationRepository.findByElderlyIdAndDeletedAtIsNull(elderlyId)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    public MedicationResponse update(Long id, MedicationRequest request) {
        Medication medication = findOrThrow(id);

        if (request.getName() != null) {
            medication.setName(request.getName());
        }
        if (request.getDosage() != null) {
            medication.setDosage(request.getDosage());
        }
        if (request.getSchedule() != null) {
            medication.setSchedule(request.getSchedule());
            medication.setNextDoseTime(calculateNextDoseTime(request.getSchedule()));
        }
        if (request.getNextDoseTime() != null) {
            medication.setNextDoseTime(request.getNextDoseTime());
        }
        if (request.getInstructions() != null) {
            medication.setInstructions(request.getInstructions());
        }
        if (request.getPhotoUrl() != null) {
            medication.setPhotoUrl(request.getPhotoUrl());
        }

        return toResponse(medicationRepository.save(medication));
    }

    public void delete(Long id) {
        Medication medication = findOrThrow(id);
        medication.setDeletedAt(OffsetDateTime.now());
        medicationRepository.save(medication);
    }

    private Medication findOrThrow(Long id) {
        return medicationRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new NotFoundException("Medication not found: " + id));
    }

    private MedicationResponse toResponse(Medication m) {
        return MedicationResponse.builder()
            .id(m.getId())
            .elderlyId(m.getElderly().getId())
            .elderlyName(m.getElderly().getName())
            .name(m.getName())
            .dosage(m.getDosage())
            .schedule(m.getSchedule())
            .nextDoseTime(m.getNextDoseTime())
            .instructions(m.getInstructions())
            .photoUrl(m.getPhotoUrl())
            .createdAt(m.getCreatedAt())
            .updatedAt(m.getUpdatedAt())
            .build();
    }

    /**
     * Calculate the next dose time from the medication schedule.
     * Finds the earliest upcoming time that matches the schedule's times and daysOfWeek.
     */
    private OffsetDateTime calculateNextDoseTime(MedicationSchedule schedule) {
        if (schedule == null || schedule.getTimes() == null || schedule.getTimes().isEmpty()) {
            return null;
        }

        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        ZonedDateTime now = ZonedDateTime.now(zone);
        List<String> times = schedule.getTimes();
        List<Integer> daysOfWeek = schedule.getDaysOfWeek();

        // Check up to 7 days ahead
        for (int dayOffset = 0; dayOffset < 7; dayOffset++) {
            ZonedDateTime candidateDay = now.plusDays(dayOffset);
            int dayValue = candidateDay.getDayOfWeek().getValue(); // 1=Mon, 7=Sun

            // If daysOfWeek specified, check if this day matches
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