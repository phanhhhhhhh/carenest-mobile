package com.carenest.backend.service;

import com.carenest.backend.dto.family.FamilyLinkRequest;
import com.carenest.backend.dto.family.FamilyLinkResponse;
import com.carenest.backend.dto.family.InviteTokenResponse;
import com.carenest.backend.entity.InviteToken;
import com.carenest.backend.entity.User;
import com.carenest.backend.entity.UserRole;
import com.carenest.backend.exception.NotFoundException;
import com.carenest.backend.repository.InviteTokenRepository;
import com.carenest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class InviteTokenService {

    /** QR codes expire after 15 minutes */
    private static final int EXPIRE_MINUTES = 15;

    private final InviteTokenRepository inviteTokenRepository;
    private final UserRepository userRepository;
    private final FamilyLinkService familyLinkService;

    /**
     * Called by the ELDERLY user to generate a one-time QR token.
     * Any previous valid tokens for this elderly remain valid until they expire;
     * generating a new one does not invalidate old ones.
     */
    public InviteTokenResponse generateToken(Long elderlyId) {
        User elderly = userRepository.findById(elderlyId)
            .orElseThrow(() -> new NotFoundException("User not found: " + elderlyId));

        if (elderly.getRole() != UserRole.ELDERLY) {
            throw new IllegalArgumentException("Only ELDERLY users can generate invite tokens");
        }

        String rawToken = UUID.randomUUID().toString().replace("-", "");

        InviteToken invite = InviteToken.builder()
            .elderly(elderly)
            .token(rawToken)
            .expiresAt(OffsetDateTime.now().plusMinutes(EXPIRE_MINUTES))
            .used(false)
            .build();

        inviteTokenRepository.save(invite);

        return InviteTokenResponse.builder()
            .token(rawToken)
            .expiresAt(invite.getExpiresAt())
            .build();
    }

    /**
     * Called by the FAMILY user after scanning the QR code.
     * Validates the token, marks it used, and creates an ACTIVE FamilyLink
     * (no extra approval step needed — elderly already consented by generating the QR).
     */
    public FamilyLinkResponse redeemToken(String token, Long familyId, String relationship) {
        InviteToken invite = inviteTokenRepository.findByToken(token)
            .orElseThrow(() -> new NotFoundException("Mã QR không hợp lệ hoặc đã hết hạn"));

        if (invite.isUsed()) {
            throw new IllegalStateException("Mã QR này đã được sử dụng");
        }

        if (invite.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new IllegalStateException("Mã QR đã hết hạn. Vui lòng yêu cầu người cao tuổi tạo mã mới");
        }

        // Mark as consumed immediately to prevent double-redemption
        invite.setUsed(true);
        inviteTokenRepository.save(invite);

        Long elderlyId = invite.getElderly().getId();
        String rel = (relationship != null && !relationship.isBlank()) ? relationship : "Người thân";

        // Create the family link — reuse existing FamilyLinkService which handles
        // duplicate-check, subscription limits, and notification creation.
        FamilyLinkRequest request = FamilyLinkRequest.builder()
            .elderlyId(elderlyId)
            .familyId(familyId)
            .relationship(rel)
            .build();

        FamilyLinkResponse response = familyLinkService.create(request);

        // Auto-approve — the elderly intentionally generated this QR so no manual
        // confirmation step is needed (upgrade PENDING → ACTIVE right away).
        familyLinkService.updateStatus(response.getId(), com.carenest.backend.entity.FamilyLinkStatus.ACTIVE);

        // Return a refreshed response with ACTIVE status
        return FamilyLinkResponse.builder()
            .id(response.getId())
            .elderlyId(response.getElderlyId())
            .elderlyName(response.getElderlyName())
            .familyId(response.getFamilyId())
            .familyName(response.getFamilyName())
            .relationship(response.getRelationship())
            .status(com.carenest.backend.entity.FamilyLinkStatus.ACTIVE)
            .createdAt(response.getCreatedAt())
            .build();
    }

    /** Scheduled cleanup — called externally (e.g. from a scheduler or on startup). */
    public void purgeExpiredTokens() {
        inviteTokenRepository.deleteExpired(OffsetDateTime.now());
    }
}
