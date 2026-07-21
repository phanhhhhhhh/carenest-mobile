package com.carenest.backend.controller;

import com.carenest.backend.dto.elderly.ElderlyProfileRequest;
import com.carenest.backend.dto.elderly.ElderlyProfileResponse;
import com.carenest.backend.service.ElderlyProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/elderly-profiles")
@RequiredArgsConstructor
public class ElderlyProfileController {

    private final ElderlyProfileService elderlyProfileService;

    @PostMapping
    @PreAuthorize("hasRole('ELDERLY')")
    public ResponseEntity<ElderlyProfileResponse> create(
        @AuthenticationPrincipal Long userId,
        @Valid @RequestBody ElderlyProfileRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(elderlyProfileService.create(userId, request));
    }

    @GetMapping("/{userId}")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #userId)")
    public ResponseEntity<ElderlyProfileResponse> getByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(elderlyProfileService.getByUserId(userId));
    }

    @PutMapping("/{userId}")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #userId)")
    public ResponseEntity<ElderlyProfileResponse> update(
        @PathVariable Long userId,
        @Valid @RequestBody ElderlyProfileRequest request
    ) {
        return ResponseEntity.ok(elderlyProfileService.update(userId, request));
    }
}