package com.carenest.backend.service;

import com.carenest.backend.dto.emergency.EmergencyEventRequest;
import com.carenest.backend.dto.emergency.EmergencyEventResponse;
import com.carenest.backend.entity.EmergencyEvent;
import com.carenest.backend.entity.EmergencyStatus;
import com.carenest.backend.entity.FamilyLinkStatus;
import com.carenest.backend.entity.User;
import com.carenest.backend.exception.NotFoundException;
import com.carenest.backend.entity.NotificationType;
import com.carenest.backend.exception.UnauthorizedException;
import com.carenest.backend.repository.ElderlyProfileRepository;
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
    private final ElderlyProfileRepository elderlyProfileRepository;
    private final NotificationService notificationService;
    private final FcmService fcmService;
    private final CameraService cameraService;

    public EmergencyEventResponse trigger(EmergencyEventRequest request) {
        User elderly = userRepository.findById(request.getElderlyId())
            .orElseThrow(() -> new NotFoundException("User (elderly) not found: " + request.getElderlyId()));

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
                    "type", "SOS",
                    "eventId", saved.getId().toString(),
                    "elderlyId", elderly.getId().toString()
                ));
            notificationService.createForUsers(familyUserIds,
                NotificationType.EMERGENCY,
                "Cảnh báo khẩn cấp (SOS)",
                elderly.getName() + " vừa kích hoạt báo động khẩn cấp!",
                Map.of(
                    "type", "SOS",
                    "eventId", saved.getId(),
                    "elderlyId", elderly.getId()
                ));
            log.info("Emergency push sent to {} family members for elderlyId={}",
                familyUserIds.size(), elderly.getId());
        }

        try {
            cameraService.captureSosSnapshot(elderly.getId(), saved.getId());
        } catch (Exception e) {
            log.warn("SOS snapshot capture failed (non-blocking): {}", e.getMessage());
        }

        return toResponse(saved);
    }

    public EmergencyEventResponse cancel(Long eventId, Long elderlyUserId) {
        EmergencyEvent event = emergencyEventRepository.findById(eventId)
            .orElseThrow(() -> new NotFoundException("EmergencyEvent not found: " + eventId));

        if (!event.getElderly().getId().equals(elderlyUserId)) {
            throw new UnauthorizedException("Only the elderly owner can cancel this emergency alert");
        }

        if (event.getStatus() == EmergencyStatus.RESOLVED || event.getStatus() == EmergencyStatus.CANCELLED) {
            return toResponse(event);
        }

        event.setStatus(EmergencyStatus.CANCELLED);
        event.setResolvedAt(OffsetDateTime.now());
        EmergencyEvent saved = emergencyEventRepository.save(event);

        List<Long> familyUserIds = familyLinkRepository
            .findAllFamilyByElderlyIdAndStatus(elderlyUserId, FamilyLinkStatus.ACTIVE)
            .stream()
            .map(fl -> fl.getFamily().getId())
            .collect(Collectors.toList());

        if (!familyUserIds.isEmpty()) {
            fcmService.sendToUsers(familyUserIds,
                "Thông báo an toàn",
                event.getElderly().getName() + " đã hủy báo động khẩn cấp (xác nhận an toàn).",
                Map.of(
                    "type", "SOS_CANCELLED",
                    "eventId", saved.getId().toString(),
                    "elderlyId", elderlyUserId.toString()
                ));
            notificationService.createForUsers(familyUserIds,
                NotificationType.EMERGENCY,
                "Báo động đã được hủy",
                event.getElderly().getName() + " đã hủy báo động khẩn cấp và xác nhận an toàn.",
                Map.of(
                    "type", "SOS_CANCELLED",
                    "eventId", saved.getId(),
                    "elderlyId", elderlyUserId,
                    "status", "CANCELLED"
                ));
        }

        log.info("SOS event {} cancelled by elderlyId={}", eventId, elderlyUserId);
        return toResponse(saved);
    }

    public EmergencyEventResponse logEmergencyCall(Long eventId, Long familyUserId) {
        EmergencyEvent event = emergencyEventRepository.findById(eventId)
            .orElseThrow(() -> new NotFoundException("EmergencyEvent not found: " + eventId));

        userRepository.findById(familyUserId)
            .orElseThrow(() -> new NotFoundException("User (family) not found: " + familyUserId));

        event.setEmergencyCallLoggedAt(OffsetDateTime.now());
        event.setEmergencyCallLoggedBy(familyUserId);
        EmergencyEvent saved = emergencyEventRepository.save(event);

        log.info("Emergency call logged for eventId={} by familyUserId={}", eventId, familyUserId);
        return toResponse(saved);
    }

    public void escalate(Long eventId, int targetLevel) {
        EmergencyEvent event = emergencyEventRepository.findById(eventId)
            .orElseThrow(() -> new NotFoundException("EmergencyEvent not found: " + eventId));

        if (event.getStatus() != EmergencyStatus.ACTIVE || event.getAcknowledgedAt() != null) {
            log.debug("Event {} is no longer active or already acknowledged - skipping escalation", eventId);
            return;
        }

        if (event.getEscalationLevel() != null && event.getEscalationLevel() >= targetLevel) {
            log.debug("Event {} already at escalation level {} >= target {} - skipping duplicate",
                eventId, event.getEscalationLevel(), targetLevel);
            return;
        }

        User elderly = event.getElderly();
        List<Long> familyUserIds = familyLinkRepository
            .findAllFamilyByElderlyIdAndStatus(elderly.getId(), FamilyLinkStatus.ACTIVE)
            .stream()
            .map(fl -> fl.getFamily().getId())
            .collect(Collectors.toList());

        // AC2: Check if elderly has secondaryFamilyContact configured
        Long secondaryUserId = elderlyProfileRepository.findByUserIdAndDeletedAtIsNull(elderly.getId())
            .map(p -> p.getSecondaryFamilyUser() != null ? p.getSecondaryFamilyUser().getId() : null)
            .orElse(null);

        if (secondaryUserId != null && !familyUserIds.contains(secondaryUserId)) {
            familyUserIds.add(secondaryUserId);
        }

        OffsetDateTime now = OffsetDateTime.now();
        event.setEscalationLevel(targetLevel);
        event.setEscalatedAt(now);
        emergencyEventRepository.save(event);

        if (!familyUserIds.isEmpty()) {
            String title;
            String body;
            String fcmType;
            if (targetLevel == 1) {
                title = "CẢNH BÁO KHẨN CẤP CẤP ĐỘ 2 (CHƯA PHẢN HỒI)";
                body = elderly.getName() + " đã phát tín hiệu SOS cách đây 3 phút nhưng chưa ai xác nhận! Vui lòng kiểm tra ngay!";
                fcmType = "SOS_ESCALATION_LEVEL_1";
            } else {
                title = "BÁO ĐỘNG ĐỎ: SOS CHƯA ĐƯỢC XỬ LÝ (10 PHÚT)";
                body = elderly.getName() + " đã gửi SOS hơn 10 phút chưa được xử lý! Bấm để gọi cấp cứu 115 ngay lập tức!";
                fcmType = "SOS_ESCALATION_LEVEL_2";
            }

            fcmService.sendToUsers(familyUserIds,
                title,
                body,
                Map.of(
                    "type", fcmType,
                    "eventId", event.getId().toString(),
                    "elderlyId", elderly.getId().toString(),
                    "escalationLevel", String.valueOf(targetLevel),
                    "urgent", "true"
                ));

            notificationService.createForUsers(familyUserIds,
                NotificationType.EMERGENCY,
                title,
                body,
                Map.of(
                    "eventId", event.getId(),
                    "elderlyId", elderly.getId(),
                    "escalationLevel", targetLevel,
                    "urgent", true
                ));

            log.info("Escalated eventId={} to level={} and notified {} users (secondaryId={})",
                eventId, targetLevel, familyUserIds.size(), secondaryUserId);
        }
    }

    public EmergencyEventResponse acknowledge(Long eventId, Long familyUserId) {
        EmergencyEvent event = emergencyEventRepository.findById(eventId)
            .orElseThrow(() -> new NotFoundException("EmergencyEvent not found: " + eventId));

        if (event.getStatus() == EmergencyStatus.RESOLVED) {
            return toResponse(event);
        }

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
            if (event.getStatus() == EmergencyStatus.RESOLVED) {
                continue;
            }
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

        String emergencyCallLoggedByName = null;
        if (e.getEmergencyCallLoggedBy() != null) {
            emergencyCallLoggedByName = userRepository.findById(e.getEmergencyCallLoggedBy())
                .map(user -> user.getName())
                .orElse(null);
        }

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
            .escalationLevel(e.getEscalationLevel() != null ? e.getEscalationLevel() : 0)
            .escalatedAt(e.getEscalatedAt())
            .emergencyCallLoggedAt(e.getEmergencyCallLoggedAt())
            .emergencyCallLoggedBy(e.getEmergencyCallLoggedBy())
            .emergencyCallLoggedByName(emergencyCallLoggedByName)
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