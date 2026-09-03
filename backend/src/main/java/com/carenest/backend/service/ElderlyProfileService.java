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
            .orElseThrow(() -> new NotFoundException("User not found: " + userId));

        if (user.getRole() != UserRole.ELDERLY) {
            throw new UnauthorizedException("Only ELDERLY role users can create a profile");
        }

        if (elderlyProfileRepository.findByUserIdAndDeletedAtIsNull(userId).isPresent()) {
            throw new IllegalArgumentException("Profile already exists for this user");
        }

        User secondaryContact = null;
        if (request.getSecondaryFamilyUserId() != null && request.getSecondaryFamilyUserId() > 0) {
            secondaryContact = userRepository.findById(request.getSecondaryFamilyUserId()).orElse(null);
        }

        ElderlyProfile profile = ElderlyProfile.builder()
            .user(user)
            .healthConditions(request.getHealthConditions())
            .emergencyContacts(mapContactsFromDto(request.getEmergencyContacts()))
            .secondaryFamilyUser(secondaryContact)
            .allergies(request.getAllergies())
            .bloodType(request.getBloodType())
            .weightKg(request.getWeightKg())
            .heightCm(request.getHeightCm())
            .notes(request.getNotes())
            .build();

        return toResponse(elderlyProfileRepository.save(profile));
    }

    @Transactional(readOnly = true)
    public ElderlyProfileResponse getByUserId(Long userId) {
        return toResponse(findOrThrow(userId));
    }

    public ElderlyProfileResponse update(Long userId, ElderlyProfileRequest request) {
        ElderlyProfile profile = findOrThrow(userId);

        if (request.getHealthConditions() != null) {
            profile.setHealthConditions(request.getHealthConditions());
        }
        if (request.getEmergencyContacts() != null) {
            profile.setEmergencyContacts(mapContactsFromDto(request.getEmergencyContacts()));
        }
        if (request.getSecondaryFamilyUserId() != null) {
            if (request.getSecondaryFamilyUserId() <= 0) {
                profile.setSecondaryFamilyUser(null);
            } else {
                User sec = userRepository.findById(request.getSecondaryFamilyUserId()).orElse(null);
                profile.setSecondaryFamilyUser(sec);
            }
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

    private ElderlyProfile findOrThrow(Long userId) {
        return elderlyProfileRepository.findByUserIdAndDeletedAtIsNull(userId)
            .orElseThrow(() -> new NotFoundException("ElderlyProfile not found for userId: " + userId));
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
        Long secondaryId = p.getSecondaryFamilyUser() != null ? p.getSecondaryFamilyUser().getId() : null;
        String secondaryName = p.getSecondaryFamilyUser() != null ? p.getSecondaryFamilyUser().getName() : null;

        return ElderlyProfileResponse.builder()
            .id(p.getId())
            .userId(p.getUser().getId())
            .userName(p.getUser().getName())
            .healthConditions(p.getHealthConditions())
            .emergencyContacts(mapContactsToDto(p.getEmergencyContacts()))
            .secondaryFamilyUserId(secondaryId)
            .secondaryFamilyUserName(secondaryName)
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