package com.carenest.backend.controller;

import com.carenest.backend.dto.family.FamilyLinkResponse;
import com.carenest.backend.dto.family.InviteTokenResponse;
import com.carenest.backend.dto.family.RedeemInviteRequest;
import com.carenest.backend.service.InviteTokenService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/invite")
@RequiredArgsConstructor
public class InviteController {

    private final InviteTokenService inviteTokenService;

    /**
     * ELDERLY generates a short-lived QR token.
     * The token string is what gets embedded in the QR code on the mobile app.
     *
     * POST /api/invite/generate
     * Auth: ELDERLY role required
     * Response: { token: String, expiresAt: OffsetDateTime }
     */
    @PostMapping("/generate")
    @PreAuthorize("hasRole('ELDERLY')")
    public ResponseEntity<InviteTokenResponse> generate(
        @AuthenticationPrincipal Long elderlyId
    ) {
        InviteTokenResponse response = inviteTokenService.generateToken(elderlyId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * FAMILY scans the QR and redeems the token to create an ACTIVE link.
     *
     * POST /api/invite/redeem
     * Auth: FAMILY role required
     * Body: { token: String, relationship?: String }
     * Response: FamilyLinkResponse (status = ACTIVE)
     */
    @PostMapping("/redeem")
    @PreAuthorize("hasRole('FAMILY')")
    public ResponseEntity<FamilyLinkResponse> redeem(
        @AuthenticationPrincipal Long familyId,
        @Valid @RequestBody RedeemInviteRequest request
    ) {
        FamilyLinkResponse response = inviteTokenService.redeemToken(
            request.getToken(),
            familyId,
            request.getRelationship()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
