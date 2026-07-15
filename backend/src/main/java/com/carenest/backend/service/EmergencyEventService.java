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
    private final CameraService cameraService;

    public EmergencyEventResponse trigger(EmergencyEventRequest request) {
        User elderly = userRepository.findById(request.getElderlyId())
            .orElseThrow(() -> new NotFoundException("User (elderly) not found: " + request.getElderlyId()));

        // Build notes with type prefix for categorization
        String enrichedNotes = request.getNotes();
        if (request.getType() != null && !request.getType().isBlank()) {
            String typePrefix = "[" + request.getType() + "]";
            if (request.getDescription() != null && !request.getDescription().isBlank()) {
                typePrefix += " " + request.getDescription();
            }
            enrichedNotes = enrichedNotes != null && !enrichedNotes.isBlank()
                ? typePrefix + " — " + enrichedNotes
                : typePrefix;
        }

        EmergencyEvent event = EmergencyEvent.builder()
            .elderly(elderly)
            .latitude(request.getLatitude())
            .longitude(request.getLongitude())
            .address(request.getAddress())
            .notes(enrichedNotes)
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
                "Emergency Alert",
                elderly.getName() + " has triggered an emergency alert",
                Map.of(
                    "type", "EMERGENCY",
                    "eventId", saved.getId().toString(),
                    "elderlyId", elderly.getId().toString()
                ));
            log.info("Emergency push sent to {} family members for elderlyId={}",
                familyUserIds.size(), elderly.getId());
        }

        // UC-28: Capture camera snapshot in parallel (non-blocking)
        try {
            cameraService.captureSosSnapshot(elderly.getId(), saved.getId());
        } catch (Exception e) {
            log.warn("SOS snapshot capture failed (non-blocking): {}", e.getMessage());
        }

        return toResponse(saved);
    }

    public EmergencyEventResponse acknowledge(Long eventId, Long familyUserId) {
        EmergencyEvent event = emergencyEventRepository.findById(eventId)
            .orElseThrow(() -> new NotFoundException("EmergencyEvent not found: " + eventId));

        userRepository.findById(familyUserId)
            .orElseThrow(() -> new NotFoundException("User (family) not found: " + familyUserId));

        event.setAcknowledgedAt(OffsetDateTime.now());
        event.setAcknowledgedBy(familyUserId);
        event.setStatus(EmergencyStatus.RESOLVED);
        event.setResolvedAt(OffsetDateTime.now());

        return toResponse(emergencyEventRepository.save(event));
    }

    @Transactional(readOnly = true)
    public EmergencyEventResponse getById(Long id) {
        EmergencyEvent event = emergencyEventRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("EmergencyEvent not found: " + id));
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
                .map(user -> user.getName())
                .orElse(null);
        }

        // Derive type from notes prefix [TYPE] if present
        String type = "SOS";
        String description = "";
        String displayNotes = e.getNotes();
        if (displayNotes != null && displayNotes.startsWith("[")) {
            int closeBracket = displayNotes.indexOf("]");
            if (closeBracket > 0) {
                String prefix = displayNotes.substring(1, closeBracket);
                int spaceAfterDesc = prefix.indexOf(" ");
                if (spaceAfterDesc > 0) {
                    type = prefix.substring(0, spaceAfterDesc);
                    description = prefix.substring(spaceAfterDesc + 1);
                } else {
                    type = prefix;
                }
                int dashIdx = displayNotes.indexOf(" — ", closeBracket);
                displayNotes = dashIdx > 0
                    ? displayNotes.substring(dashIdx + 3).trim()
                    : displayNotes.substring(closeBracket + 1).trim();
                if (displayNotes.isEmpty()) displayNotes = null;
            }
        }

        return EmergencyEventResponse.builder()
            .id(e.getId())
            .elderlyId(e.getElderly().getId())
            .elderlyName(e.getElderly().getName())
            .latitude(e.getLatitude())
            .longitude(e.getLongitude())
            .address(e.getAddress())
            .type(type)
            .description(description)
            .status(e.getStatus())
            .triggeredAt(e.getTriggeredAt())
            .resolvedAt(e.getResolvedAt())
            .acknowledgedAt(e.getAcknowledgedAt())
            .acknowledgedBy(e.getAcknowledgedBy())
            .acknowledgedByName(acknowledgedByName)
            .notes(displayNotes)
            .createdAt(e.getCreatedAt())
            .updatedAt(e.getUpdatedAt())
            .build();
    }
}