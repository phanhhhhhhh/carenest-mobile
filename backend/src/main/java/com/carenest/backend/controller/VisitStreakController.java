package com.carenest.backend.controller;

import com.carenest.backend.dto.visit.ConfirmVisitRequest;
import com.carenest.backend.dto.visit.VisitSettingsRequest;
import com.carenest.backend.dto.visit.VisitStreakResponse;
import com.carenest.backend.service.VisitStreakService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Home Visit Reminder / Visit Streak (UC A7). */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class VisitStreakController {

    private final VisitStreakService visitStreakService;

    @GetMapping("/elderly/{elderlyId}/visit-streak")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #elderlyId)")
    public ResponseEntity<VisitStreakResponse> getStreak(@PathVariable Long elderlyId) {
        return ResponseEntity.ok(visitStreakService.getStreak(elderlyId));
    }

    @PostMapping("/elderly/{elderlyId}/visits")
    @PreAuthorize("hasRole('FAMILY') and @authz.isOwnerOrLinkedFamily(authentication.principal, #elderlyId)")
    public ResponseEntity<VisitStreakResponse> confirmVisit(
        @PathVariable Long elderlyId,
        @AuthenticationPrincipal Long familyUserId,
        @Valid @RequestBody(required = false) ConfirmVisitRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(visitStreakService.confirmVisit(elderlyId, familyUserId, request));
    }

    @PatchMapping("/elderly/{elderlyId}/visit-streak/settings")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #elderlyId)")
    public ResponseEntity<VisitStreakResponse> updateSettings(
        @PathVariable Long elderlyId,
        @Valid @RequestBody VisitSettingsRequest request
    ) {
        return ResponseEntity.ok(visitStreakService.updateSettings(elderlyId, request));
    }
}
