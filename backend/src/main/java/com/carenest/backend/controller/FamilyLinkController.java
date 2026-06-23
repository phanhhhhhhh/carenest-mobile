package com.carenest.backend.controller;

import com.carenest.backend.dto.family.FamilyLinkRequest;
import com.carenest.backend.dto.family.FamilyLinkResponse;
import com.carenest.backend.dto.family.FamilyLinkStatusRequest;
import com.carenest.backend.service.FamilyLinkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class FamilyLinkController {

    private final FamilyLinkService familyLinkService;

    @PostMapping("/api/family-links")
    public ResponseEntity<FamilyLinkResponse> create(
        @Valid @RequestBody FamilyLinkRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(familyLinkService.create(request));
    }

    @GetMapping("/api/elderly/{elderlyId}/family")
    public ResponseEntity<List<FamilyLinkResponse>> getFamilyByElderlyId(
        @PathVariable Long elderlyId
    ) {
        return ResponseEntity.ok(familyLinkService.getFamilyByElderlyId(elderlyId));
    }

    @PatchMapping("/api/family-links/{id}/status")
    public ResponseEntity<FamilyLinkResponse> updateStatus(
        @PathVariable Long id,
        @Valid @RequestBody FamilyLinkStatusRequest request
    ) {
        return ResponseEntity.ok(familyLinkService.updateStatus(id, request.getStatus()));
    }
}
