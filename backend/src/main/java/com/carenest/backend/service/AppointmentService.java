package com.carenest.backend.service;

import com.carenest.backend.dto.appointment.AppointmentRequest;
import com.carenest.backend.dto.appointment.AppointmentResponse;
import com.carenest.backend.entity.Appointment;
import com.carenest.backend.entity.AppointmentStatus;
import com.carenest.backend.entity.User;
import com.carenest.backend.entity.UserRole;
import com.carenest.backend.exception.NotFoundException;
import com.carenest.backend.repository.AppointmentRepository;
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
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;

    public AppointmentResponse create(AppointmentRequest request) {
        User elderly = userRepository.findById(request.getElderlyId())
            .orElseThrow(() -> new NotFoundException("User (elderly) không tồn tại: " + request.getElderlyId()));

        if (elderly.getRole() != UserRole.ELDERLY) {
            throw new IllegalArgumentException("elderlyId phải là user có role ELDERLY");
        }

        Appointment appointment = Appointment.builder()
            .elderly(elderly)
            .doctor(request.getDoctor())
            .specialty(request.getSpecialty())
            .location(request.getLocation())
            .datetime(request.getDatetime())
            .notes(request.getNotes())
            .status(AppointmentStatus.SCHEDULED)
            .build();

        return toResponse(appointmentRepository.save(appointment));
    }

    @Transactional(readOnly = true)
    public AppointmentResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getByUserId(Long userId) {
        return appointmentRepository.findByElderlyIdAndDatetimeBetweenAndDeletedAtIsNullOrderByDatetimeAsc(
                userId,
                OffsetDateTime.now().minusDays(30),
                OffsetDateTime.now().plusYears(1))
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    public AppointmentResponse update(Long id, AppointmentRequest request) {
        Appointment appointment = findOrThrow(id);

        if (request.getDoctor() != null) {
            appointment.setDoctor(request.getDoctor());
        }
        if (request.getSpecialty() != null) {
            appointment.setSpecialty(request.getSpecialty());
        }
        if (request.getLocation() != null) {
            appointment.setLocation(request.getLocation());
        }
        if (request.getDatetime() != null) {
            appointment.setDatetime(request.getDatetime());
        }
        if (request.getNotes() != null) {
            appointment.setNotes(request.getNotes());
        }

        return toResponse(appointmentRepository.save(appointment));
    }

    public void delete(Long id) {
        Appointment appointment = findOrThrow(id);
        appointment.setDeletedAt(OffsetDateTime.now());
        appointmentRepository.save(appointment);
    }

    private Appointment findOrThrow(Long id) {
        return appointmentRepository.findById(id)
            .filter(a -> a.getDeletedAt() == null)
            .orElseThrow(() -> new NotFoundException("Appointment không tồn tại: " + id));
    }

    private AppointmentResponse toResponse(Appointment a) {
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
