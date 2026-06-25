package com.carenest.backend.security;

import com.carenest.backend.entity.FamilyLinkStatus;
import com.carenest.backend.repository.ElderlyProfileRepository;
import com.carenest.backend.repository.FamilyLinkRepository;
import com.carenest.backend.repository.MedicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service("authz")
@RequiredArgsConstructor
public class AuthorizationService {

    private final ElderlyProfileRepository elderlyProfileRepository;
    private final FamilyLinkRepository familyLinkRepository;
    private final MedicationRepository medicationRepository;

    /**
     * Returns true if principalId is the elderly user themselves OR an ACTIVE-linked family member.
     */
    public boolean isOwnerOrLinkedFamily(Long principalId, Long elderlyId) {
        if (principalId == null || elderlyId == null) return false;
        if (principalId.equals(elderlyId)) return true;
        return familyLinkRepository.existsByElderlyIdAndFamilyIdAndStatusAndDeletedAtIsNull(
            elderlyId, principalId, FamilyLinkStatus.ACTIVE);
    }

    /**
     * Returns true if principalId can access the elderly profile identified by profileId.
     * Looks up the profile's owner, then delegates to isOwnerOrLinkedFamily.
     */
    public boolean canAccessElderlyProfile(Long principalId, Long profileId) {
        if (principalId == null || profileId == null) return false;
        return elderlyProfileRepository.findByIdAndDeletedAtIsNull(profileId)
            .map(p -> isOwnerOrLinkedFamily(principalId, p.getUser().getId()))
            .orElse(false);
    }

    /**
     * Returns true if principalId is either the elderly or the family member in the given link.
     */
    public boolean isFamilyLinkParticipant(Long principalId, Long linkId) {
        if (principalId == null || linkId == null) return false;
        return familyLinkRepository.findByIdAndDeletedAtIsNull(linkId)
            .map(l -> principalId.equals(l.getElderly().getId()) ||
                      principalId.equals(l.getFamily().getId()))
            .orElse(false);
    }

    /**
     * Returns true if principalId can access the medication identified by medicationId.
     * Looks up the medication's elderly owner, then delegates to isOwnerOrLinkedFamily.
     */
    public boolean canAccessMedication(Long principalId, Long medicationId) {
        if (principalId == null || medicationId == null) return false;
        return medicationRepository.findByIdAndDeletedAtIsNull(medicationId)
            .map(m -> isOwnerOrLinkedFamily(principalId, m.getElderly().getId()))
            .orElse(false);
    }
}
