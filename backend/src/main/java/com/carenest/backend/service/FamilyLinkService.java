package com.carenest.backend.service;

import com.carenest.backend.dto.family.FamilyElderlyResponse;
import com.carenest.backend.dto.family.FamilyLinkRequest;
import com.carenest.backend.dto.family.FamilyLinkResponse;
import com.carenest.backend.entity.FamilyLink;
import com.carenest.backend.entity.FamilyLinkStatus;
import com.carenest.backend.entity.Notification;
import com.carenest.backend.entity.NotificationType;
import com.carenest.backend.entity.User;
import com.carenest.backend.entity.UserRole;
import com.carenest.backend.exception.ConflictException;
import com.carenest.backend.exception.NotFoundException;
import com.carenest.backend.repository.ElderlyProfileRepository;
import com.carenest.backend.repository.FamilyLinkRepository;
import com.carenest.backend.repository.NotificationRepository;
import com.carenest.backend.repository.UserRepository;

import java.util.Collections;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class FamilyLinkService {

    private final FamilyLinkRepository familyLinkRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final ElderlyProfileRepository elderlyProfileRepository;

    public FamilyLinkResponse create(FamilyLinkRequest request) {
        User elderly = userRepository.findById(request.getElderlyId())
            .orElseThrow(() -> new NotFoundException("User (elderly) không tồn tại: " + request.getElderlyId()));

        if (elderly.getRole() != UserRole.ELDERLY) {
            throw new IllegalArgumentException("elderlyId phải là user có role ELDERLY");
        }

        User family = userRepository.findById(request.getFamilyId())
            .orElseThrow(() -> new NotFoundException("User (family) không tồn tại: " + request.getFamilyId()));

        if (family.getRole() != UserRole.FAMILY) {
            throw new IllegalArgumentException("familyId phải là user có role FAMILY");
        }

        if (familyLinkRepository.findByElderlyIdAndFamilyIdAndDeletedAtIsNull(
                request.getElderlyId(), request.getFamilyId()).isPresent()) {
            throw new ConflictException("Liên kết giữa elderly và family đã tồn tại");
        }

        FamilyLink link = FamilyLink.builder()
            .elderly(elderly)
            .family(family)
            .relationship(request.getRelationship())
            .status(FamilyLinkStatus.PENDING)
            .build();

        FamilyLink saved = familyLinkRepository.save(link);

        // UC-04: System sends a link request notification to Elderly
        Notification notification = Notification.builder()
            .user(elderly)
            .type(NotificationType.FAMILY_LINK_REQUEST)
            .title("Yêu cầu liên kết gia đình")
            .body(family.getName() + " muốn liên kết để theo dõi sức khỏe của bạn")
            .data(java.util.Map.of(
                "linkId", saved.getId(),
                "familyId", family.getId(),
                "familyName", family.getName(),
                "relationship", request.getRelationship()
            ))
            .build();
        notificationRepository.save(notification);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<FamilyLinkResponse> getFamilyByElderlyId(Long elderlyId) {
        return familyLinkRepository.findAllFamilyByElderlyIdAndStatus(elderlyId, FamilyLinkStatus.ACTIVE)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FamilyElderlyResponse> getElderlyByFamilyId(Long familyId) {
        return familyLinkRepository.findAllElderlyByFamilyIdAndStatus(familyId, FamilyLinkStatus.ACTIVE)
            .stream()
            .map(this::toElderlyResponse)
            .collect(Collectors.toList());
    }

    public FamilyLinkResponse updateStatus(Long id, FamilyLinkStatus status) {
        FamilyLink link = familyLinkRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new NotFoundException("FamilyLink không tồn tại: " + id));

        link.setStatus(status);
        return toResponse(familyLinkRepository.save(link));
    }

    private FamilyElderlyResponse toElderlyResponse(FamilyLink fl) {
        List<String> healthConditions = elderlyProfileRepository
            .findByUserIdAndDeletedAtIsNull(fl.getElderly().getId())
            .map(profile -> profile.getHealthConditions() != null
                ? profile.getHealthConditions()
                : Collections.<String>emptyList())
            .orElse(Collections.emptyList());

        return FamilyElderlyResponse.builder()
            .linkId(fl.getId())
            .elderlyId(fl.getElderly().getId())
            .elderlyName(fl.getElderly().getName())
            .elderlyPhone(fl.getElderly().getPhone())
            .relationship(fl.getRelationship())
            .status(fl.getStatus())
            .createdAt(fl.getCreatedAt())
            .healthConditions(healthConditions)
            .build();
    }

    private FamilyLinkResponse toResponse(FamilyLink fl) {
        return FamilyLinkResponse.builder()
            .id(fl.getId())
            .elderlyId(fl.getElderly().getId())
            .elderlyName(fl.getElderly().getName())
            .familyId(fl.getFamily().getId())
            .familyName(fl.getFamily().getName())
            .relationship(fl.getRelationship())
            .status(fl.getStatus())
            .createdAt(fl.getCreatedAt())
            .build();
    }
}