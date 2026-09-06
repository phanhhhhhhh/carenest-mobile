package com.carenest.backend.controller;

import com.carenest.backend.dto.family.FamilyElderlyResponse;
import com.carenest.backend.dto.family.FamilyLinkAvailabilityRequest;
import com.carenest.backend.dto.family.FamilyLinkRequest;
import com.carenest.backend.dto.family.FamilyLinkResponse;
import com.carenest.backend.dto.family.FamilyLinkStatusRequest;
import com.carenest.backend.service.FamilyLinkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FamilyLinkController {

    private final FamilyLinkService familyLinkService;

    @PostMapping("/family-links")
    @PreAuthorize("hasRole('FAMILY') and #request.familyId == authentication.principal")
    public ResponseEntity<FamilyLinkResponse> create(
        @Valid @RequestBody FamilyLinkRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(familyLinkService.create(request));
    }

    @GetMapping("/elderly/{elderlyId}/family")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #elderlyId)")
    public ResponseEntity<List<FamilyLinkResponse>> getFamilyByElderlyId(
        @PathVariable Long elderlyId
    ) {
        return ResponseEntity.ok(familyLinkService.getFamilyByElderlyId(elderlyId));
    }

    @GetMapping("/family/{familyId}/elderly")
    @PreAuthorize("hasAnyRole('FAMILY', 'ADMIN') and (#familyId == authentication.principal or hasRole('ADMIN'))")
    public ResponseEntity<List<FamilyElderlyResponse>> getElderlyByFamilyId(
        @PathVariable Long familyId
    ) {
        return ResponseEntity.ok(familyLinkService.getElderlyByFamilyId(familyId));
    }

    @PatchMapping("/family-links/{id}/status")
    @PreAuthorize("@authz.isFamilyLinkParticipant(authentication.principal, #id)")
    public ResponseEntity<FamilyLinkResponse> updateStatus(
        @PathVariable Long id,
        @org.springframework.security.core.annotation.AuthenticationPrincipal Long principalId,
        @Valid @RequestBody FamilyLinkStatusRequest request
    ) {
        return ResponseEntity.ok(familyLinkService.updateStatus(id, request.getStatus(), principalId));
    }

    @PatchMapping("/family-links/{id}/availability")
    @PreAuthorize("hasRole('FAMILY') and @authz.isFamilyLinkParticipant(authentication.principal, #id)")
    public ResponseEntity<FamilyLinkResponse> updateAvailability(
        @PathVariable Long id,
        @Valid @RequestBody FamilyLinkAvailabilityRequest request
    ) {
        return ResponseEntity.ok(familyLinkService.updateAvailability(id, request.getAvailabilityStatus()));
    }
}