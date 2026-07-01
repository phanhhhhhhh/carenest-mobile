package com.carenest.backend.controller;

import com.carenest.backend.dto.medication.MedicationLogRequest;
import com.carenest.backend.dto.medication.MedicationLogResponse;
import com.carenest.backend.service.MedicationLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MedicationLogController {

    private final MedicationLogService medicationLogService;

    @PostMapping("/medications/{medicationId}/logs")
    @PreAuthorize("@authz.canAccessMedication(authentication.principal, #medicationId)")
    public ResponseEntity<MedicationLogResponse> create(
        @PathVariable Long medicationId,
        @Valid @RequestBody MedicationLogRequest request
    ) {
        if (!request.getMedicationId().equals(medicationId)) {
            throw new IllegalArgumentException("medicationId in path and body must match");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(medicationLogService.create(request));
    }

    @GetMapping("/medications/{medicationId}/logs")
    @PreAuthorize("@authz.canAccessMedication(authentication.principal, #medicationId)")
    public ResponseEntity<List<MedicationLogResponse>> getByMedicationId(
        @PathVariable Long medicationId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to
    ) {
        if (from == null) from = OffsetDateTime.now().minusDays(7);
        if (to == null) to = OffsetDateTime.now();
        return ResponseEntity.ok(medicationLogService.getByMedicationId(medicationId, from, to));
    }

    @GetMapping("/elderly/{elderlyId}/medication-logs")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #elderlyId)")
    public ResponseEntity<List<MedicationLogResponse>> getByElderlyId(
        @PathVariable Long elderlyId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to
    ) {
        if (from == null) from = OffsetDateTime.now().minusDays(7);
        if (to == null) to = OffsetDateTime.now();
        return ResponseEntity.ok(medicationLogService.getByElderlyId(elderlyId, from, to));
    }

    @GetMapping("/medication-logs/{id}")
    @PreAuthorize("@authz.canAccessMedicationLog(authentication.principal, #id)")
    public ResponseEntity<MedicationLogResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(medicationLogService.getById(id));
    }
}
