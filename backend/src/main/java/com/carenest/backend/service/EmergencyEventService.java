package com.carenest.backend.service;

import com.carenest.backend.dto.emergency.EmergencyEventRequest;
import com.carenest.backend.dto.emergency.EmergencyEventResponse;
import com.carenest.backend.entity.EmergencyEvent;
import com.carenest.backend.entity.EmergencyStatus;
import com.carenest.backend.entity.FamilyLinkStatus;
import com.carenest.backend.entity.User;
import com.carenest.backend.exception.NotFoundException;
import com.carenest.backend.repository.EmergencyEventRepository;
import com.carenest.backend.repository.FamilyLinkRepository;
import com.carenest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class EmergencyEventService {

    private final EmergencyEventRepository emergencyEventRepository;
    private final UserRepository userRepository;
    private final FamilyLinkRepository familyLinkRepository;
    private final FcmService fcmService;

    public EmergencyEventResponse trigger(EmergencyEventRequest request) {
        User elderly = userRepository.findById(request.getElderlyId())
            .orElseThrow(() -> new NotFoundException("User (elderly) không tồn tại: " + request.getElderlyId()));

        EmergencyEvent event = EmergencyEvent.builder()
            .elderly(elderly)
            .latitude(request.getLatitude())
            .longitude(request.getLongitude())
            .address(request.getAddress())
            .notes(request.getNotes())
            .status(EmergencyStatus.ACTIVE)
            .triggeredAt(OffsetDateTime.now())
            .build();

        EmergencyEvent saved = emergencyEventRepository.save(event);

        // Send push notifications to all linked family members
        List<Long> familyUserIds = familyLinkRepository
            .findAllFamilyByElderlyIdAndStatus(elderly.getId(), FamilyLinkStatus.ACTIVE)
            .stream()
            .map(fl -> fl.getFamily().getId())
            .collect(Collectors.toList());

        if (!familyUserIds.isEmpty()) {
            fcmService.sendToUsers(familyUserIds,
                "Cảnh báo khẩn cấp",
                elderly.getName() + " đã kích hoạt cảnh báo khẩn cấp",
                Map.of(
                    "type", "EMERGENCY",
                    "eventId", saved.getId().toString(),
                    "elderlyId", elderly.getId().toString()
                ));
            log.info("Emergency push sent to {} family members for elderlyId={}",
                familyUserIds.size(), elderly.getId());
        }

        return toResponse(saved);
    }

    public EmergencyEventResponse acknowledge(Long eventId, Long familyUserId) {
        EmergencyEvent event = emergencyEventRepository.findById(eventId)
            .orElseThrow(() -> new NotFoundException("EmergencyEvent không tồn tại: " + eventId));

        User family = userRepository.findById(familyUserId)
            .orElseThrow(() -> new NotFoundException("User (family) không tồn tại: " + familyUserId));

        event.setAcknowledgedAt(OffsetDateTime.now());
        event.setAcknowledgedBy(familyUserId);
        event.setStatus(EmergencyStatus.RESOLVED);
        event.setResolvedAt(OffsetDateTime.now());

        return toResponse(emergencyEventRepository.save(event));
    }

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

    @Transactional
    public int acknowledgeAllForUser(Long elderlyId, Long acknowledgedBy) {
        List<EmergencyEvent> activeEvents = emergencyEventRepository
            .findByElderlyIdAndStatusOrderByTriggeredAtDesc(elderlyId, EmergencyStatus.ACTIVE);

        OffsetDateTime now = OffsetDateTime.now();
        int count = 0;
        for (EmergencyEvent event : activeEvents) {
            event.setAcknowledgedAt(now);
            event.setAcknowledgedBy(acknowledgedBy);
            event.setStatus(EmergencyStatus.RESOLVED);
            event.setResolvedAt(now);
            emergencyEventRepository.save(event);
            count++;
        }

        log.info("Acknowledged {} active emergency events for elderlyId={}", count, elderlyId);
        return count;
    }

    private EmergencyEventResponse toResponse(EmergencyEvent e) {
        String acknowledgedByName = null;
        if (e.getAcknowledgedBy() != null) {
            acknowledgedByName = userRepository.findById(e.getAcknowledgedBy())
                .map(User::getName)
                .orElse(null);
        }

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
            .acknowledgedAt(e.getAcknowledgedAt())
            .acknowledgedBy(e.getAcknowledgedBy())
            .acknowledgedByName(acknowledgedByName)
            .notes(e.getNotes())
            .createdAt(e.getCreatedAt())
            .updatedAt(e.getUpdatedAt())
            .build();
    }
}