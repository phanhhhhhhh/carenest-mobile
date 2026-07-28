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

import java.time.OffsetDateTime;
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

    private OffsetDateTime calculateNextDoseTime(MedicationSchedule schedule) {
        return MedicationScheduleCalculator.nextDoseTime(schedule);
    }
}