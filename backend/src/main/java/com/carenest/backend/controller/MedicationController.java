package com.carenest.backend.controller;

import com.carenest.backend.dto.medication.MedicationRequest;
import com.carenest.backend.dto.medication.MedicationResponse;
import com.carenest.backend.service.MedicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
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
public class MedicationController {

    private final MedicationService medicationService;

    @PostMapping("/medications")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #request.elderlyId)")
    public ResponseEntity<MedicationResponse> create(
        @Valid @RequestBody MedicationRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(medicationService.create(request));
    }

    @GetMapping("/users/{userId}/medications")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #userId)")
    public ResponseEntity<List<MedicationResponse>> getByElderlyId(
        @PathVariable Long userId
    ) {
        return ResponseEntity.ok(medicationService.getByElderlyId(userId));
    }

    @PatchMapping("/medications/{id}")
    @PreAuthorize("@authz.canAccessMedication(authentication.principal, #id)")
    public ResponseEntity<MedicationResponse> update(
        @PathVariable Long id,
        @Valid @RequestBody MedicationRequest request
    ) {
        return ResponseEntity.ok(medicationService.update(id, request));
    }

    @DeleteMapping("/medications/{id}")
    @PreAuthorize("@authz.canAccessMedication(authentication.principal, #id)")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        medicationService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
