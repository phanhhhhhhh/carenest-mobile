package com.carenest.backend.controller;

import com.carenest.backend.dto.emergency.EmergencyEventResponse;
import com.carenest.backend.entity.EmergencyStatus;
import com.carenest.backend.service.EmergencyEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class EmergencyEventController {

    private final EmergencyEventService emergencyEventService;

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
}