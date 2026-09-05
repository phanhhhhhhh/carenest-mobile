package com.carenest.backend.controller;

import com.carenest.backend.dto.family.FamilyBroadcastResponse;
import com.carenest.backend.service.NotificationBroadcastService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FamilyBroadcastController {

    private final NotificationBroadcastService broadcastService;

    /** In-flight / escalated Free Broadcasts for an elderly — family shows an "I've got this" banner. */
    @GetMapping("/elderly/{elderlyId}/broadcasts/active")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #elderlyId)")
    public ResponseEntity<List<FamilyBroadcastResponse>> getActive(@PathVariable Long elderlyId) {
        return ResponseEntity.ok(broadcastService.getActiveForElderly(elderlyId));
    }

    @PatchMapping("/broadcasts/{id}/acknowledge")
    @PreAuthorize("hasRole('FAMILY') and @authz.canAccessBroadcast(authentication.principal, #id)")
    public ResponseEntity<FamilyBroadcastResponse> acknowledge(
        @PathVariable Long id,
        @AuthenticationPrincipal Long familyUserId
    ) {
        return ResponseEntity.ok(broadcastService.acknowledgeAsResponse(id, familyUserId));
    }
}
