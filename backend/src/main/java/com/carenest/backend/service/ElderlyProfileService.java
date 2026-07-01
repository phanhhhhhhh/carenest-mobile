package com.carenest.backend.service;

import com.carenest.backend.dto.elderly.ElderlyProfileRequest;
import com.carenest.backend.dto.elderly.ElderlyProfileResponse;
import com.carenest.backend.dto.elderly.EmergencyContactDto;
import com.carenest.backend.entity.ElderlyProfile;
import com.carenest.backend.entity.EmergencyContact;
import com.carenest.backend.entity.User;
import com.carenest.backend.entity.UserRole;
import com.carenest.backend.exception.NotFoundException;
import com.carenest.backend.exception.UnauthorizedException;
import com.carenest.backend.repository.ElderlyProfileRepository;
import com.carenest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ElderlyProfileService {

    private final ElderlyProfileRepository elderlyProfileRepository;
    private final UserRepository userRepository;

    public ElderlyProfileResponse create(Long userId, ElderlyProfileRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("User không tồn tại: " + userId));

        if (user.getRole() != UserRole.ELDERLY) {
            throw new UnauthorizedException("Chỉ user có role ELDERLY mới có thể tạo profile");
        }

        if (elderlyProfileRepository.findByUserIdAndDeletedAtIsNull(userId).isPresent()) {
            throw new IllegalArgumentException("Profile đã tồn tại cho user này");
        }

        ElderlyProfile profile = ElderlyProfile.builder()
            .user(user)
            .healthConditions(request.getHealthConditions())
            .emergencyContacts(mapContactsFromDto(request.getEmergencyContacts()))
            .allergies(request.getAllergies())
            .bloodType(request.getBloodType())
            .weightKg(request.getWeightKg())
            .heightCm(request.getHeightCm())
            .notes(request.getNotes())
            .build();

        return toResponse(elderlyProfileRepository.save(profile));
    }

    @Transactional(readOnly = true)
    public ElderlyProfileResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    public ElderlyProfileResponse update(Long id, ElderlyProfileRequest request) {
        ElderlyProfile profile = findOrThrow(id);

        if (request.getHealthConditions() != null) {
            profile.setHealthConditions(request.getHealthConditions());
        }
        if (request.getEmergencyContacts() != null) {
            profile.setEmergencyContacts(mapContactsFromDto(request.getEmergencyContacts()));
        }
        if (request.getAllergies() != null) {
            profile.setAllergies(request.getAllergies());
        }
        if (request.getBloodType() != null) {
            profile.setBloodType(request.getBloodType());
        }
        if (request.getWeightKg() != null) {
            profile.setWeightKg(request.getWeightKg());
        }
        if (request.getHeightCm() != null) {
            profile.setHeightCm(request.getHeightCm());
        }
        if (request.getNotes() != null) {
            profile.setNotes(request.getNotes());
        }

        return toResponse(elderlyProfileRepository.save(profile));
    }

    private ElderlyProfile findOrThrow(Long id) {
        return elderlyProfileRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new NotFoundException("ElderlyProfile không tồn tại: " + id));
    }

    private List<EmergencyContact> mapContactsFromDto(List<EmergencyContactDto> dtos) {
        if (dtos == null) return null;
        return dtos.stream()
            .map(dto -> EmergencyContact.builder()
                .name(dto.getName())
                .phone(dto.getPhone())
                .relationship(dto.getRelationship())
                .build())
            .collect(Collectors.toList());
    }

    private List<EmergencyContactDto> mapContactsToDto(List<EmergencyContact> contacts) {
        if (contacts == null) return null;
        return contacts.stream()
            .map(c -> EmergencyContactDto.builder()
                .name(c.getName())
                .phone(c.getPhone())
                .relationship(c.getRelationship())
                .build())
            .collect(Collectors.toList());
    }

    private ElderlyProfileResponse toResponse(ElderlyProfile p) {
        return ElderlyProfileResponse.builder()
            .id(p.getId())
            .userId(p.getUser().getId())
            .userName(p.getUser().getName())
            .healthConditions(p.getHealthConditions())
            .emergencyContacts(mapContactsToDto(p.getEmergencyContacts()))
            .allergies(p.getAllergies())
            .bloodType(p.getBloodType())
            .weightKg(p.getWeightKg())
            .heightCm(p.getHeightCm())
            .notes(p.getNotes())
            .createdAt(p.getCreatedAt())
            .updatedAt(p.getUpdatedAt())
            .build();
    }
}