package com.carenest.backend.controller;

import com.carenest.backend.dto.emergency.EmergencyEventRequest;
import com.carenest.backend.dto.emergency.EmergencyEventResponse;
import com.carenest.backend.entity.EmergencyStatus;
import com.carenest.backend.service.EmergencyEventService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class EmergencyEventController {

    private final EmergencyEventService emergencyEventService;

    @PostMapping("/elderly/{elderlyId}/emergency-events")
    @PreAuthorize("hasRole('ELDERLY') and @authz.isOwnerOrLinkedFamily(authentication.principal, #elderlyId)")
    public ResponseEntity<EmergencyEventResponse> trigger(
        @PathVariable Long elderlyId,
        @Valid @RequestBody EmergencyEventRequest request
    ) {
        if (!request.getElderlyId().equals(elderlyId)) {
            throw new IllegalArgumentException("elderlyId in path and body must match");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(emergencyEventService.trigger(request));
    }

    @PatchMapping("/emergency-events/{id}/acknowledge")
    @PreAuthorize("hasRole('FAMILY') and @authz.canAccessEmergencyEvent(authentication.principal, #id)")
    public ResponseEntity<EmergencyEventResponse> acknowledge(
        @PathVariable Long id,
        @AuthenticationPrincipal Long familyUserId
    ) {
        return ResponseEntity.ok(emergencyEventService.acknowledge(id, familyUserId));
    }

    @PatchMapping("/elderly/{elderlyId}/emergency-events/{id}/cancel")
    @PreAuthorize("hasRole('ELDERLY') and @authz.isOwnerOrLinkedFamily(authentication.principal, #elderlyId)")
    public ResponseEntity<EmergencyEventResponse> cancel(
        @PathVariable Long elderlyId,
        @PathVariable Long id,
        @AuthenticationPrincipal Long elderlyPrincipalId
    ) {
        return ResponseEntity.ok(emergencyEventService.cancel(id, elderlyPrincipalId));
    }

    @PostMapping("/emergency-events/{id}/call-emergency")
    @PreAuthorize("@authz.canAccessEmergencyEvent(authentication.principal, #id)")
    public ResponseEntity<EmergencyEventResponse> logEmergencyCall(
        @PathVariable Long id,
        @AuthenticationPrincipal Long familyUserId
    ) {
        return ResponseEntity.ok(emergencyEventService.logEmergencyCall(id, familyUserId));
    }

    @GetMapping("/elderly/{elderlyId}/emergency-events")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #elderlyId)")
    public ResponseEntity<List<EmergencyEventResponse>> getByElderlyId(
        @PathVariable Long elderlyId,
        @RequestParam(required = false) EmergencyStatus status
    ) {
        if (status != null) {
            return ResponseEntity.ok(emergencyEventService.getByElderlyIdAndStatus(elderlyId, status));
        }
        return ResponseEntity.ok(emergencyEventService.getByElderlyId(elderlyId));
    }

    @GetMapping("/elderly/{elderlyId}/emergency-events/active")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #elderlyId)")
    public ResponseEntity<EmergencyEventResponse> getActiveEvent(
        @PathVariable Long elderlyId
    ) {
        EmergencyEventResponse response = emergencyEventService.getActiveEvent(elderlyId);
        return response != null ? ResponseEntity.ok(response) : ResponseEntity.noContent().build();
    }

    @GetMapping("/emergency-events/{id}")
    @PreAuthorize("@authz.canAccessEmergencyEvent(authentication.principal, #id)")
    public ResponseEntity<EmergencyEventResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(emergencyEventService.getById(id));
    }

    @PatchMapping("/users/{userId}/emergency-events/read-all")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #userId)")
    public ResponseEntity<Map<String, Object>> readAll(
        @PathVariable Long userId,
        @AuthenticationPrincipal Long principalId
    ) {
        int count = emergencyEventService.acknowledgeAllForUser(userId, principalId);
        return ResponseEntity.ok(Map.of(
            "message", "All emergency alerts marked as read",
            "acknowledgedCount", count
        ));
    }
}