package com.carenest.backend.service;

import com.carenest.backend.dto.emergency.EmergencyEventResponse;
import com.carenest.backend.entity.EmergencyEvent;
import com.carenest.backend.entity.EmergencyStatus;
import com.carenest.backend.exception.NotFoundException;
import com.carenest.backend.repository.EmergencyEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class EmergencyEventService {

    private final EmergencyEventRepository emergencyEventRepository;

    @Transactional(readOnly = true)
    public EmergencyEventResponse getById(Long id) {
        EmergencyEvent event = emergencyEventRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("EmergencyEvent không tồn tại: " + id));
        return toResponse(event);
    }

    @Transactional(readOnly = true)
    public List<EmergencyEventResponse> getByElderlyId(Long elderlyId) {
        return emergencyEventRepository.findByElderlyIdOrderByTriggeredAtDesc(elderlyId)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EmergencyEventResponse> getByElderlyIdAndStatus(Long elderlyId, EmergencyStatus status) {
        return emergencyEventRepository.findByElderlyIdAndStatusOrderByTriggeredAtDesc(elderlyId, status)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EmergencyEventResponse getActiveEvent(Long elderlyId) {
        return emergencyEventRepository.findTopByElderlyIdAndStatusOrderByTriggeredAtDesc(
            elderlyId, EmergencyStatus.ACTIVE
        ).map(this::toResponse).orElse(null);
    }

    private EmergencyEventResponse toResponse(EmergencyEvent e) {
        return EmergencyEventResponse.builder()
            .id(e.getId())
            .elderlyId(e.getElderly().getId())
            .elderlyName(e.getElderly().getName())
            .latitude(e.getLatitude())
            .longitude(e.getLongitude())
            .address(e.getAddress())
            .status(e.getStatus())
            .triggeredAt(e.getTriggeredAt())
            .resolvedAt(e.getResolvedAt())
            .notes(e.getNotes())
            .createdAt(e.getCreatedAt())
            .updatedAt(e.getUpdatedAt())
            .build();
    }
}
