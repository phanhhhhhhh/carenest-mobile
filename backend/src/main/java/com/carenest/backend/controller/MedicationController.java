package com.carenest.backend.controller;

import com.carenest.backend.dto.medication.MedicationDraftResponse;
import com.carenest.backend.dto.medication.MedicationRequest;
import com.carenest.backend.dto.medication.MedicationResponse;
import com.carenest.backend.service.MedicationService;
import com.carenest.backend.service.MedicationVoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MedicationController {

    private final MedicationService medicationService;
    private final MedicationVoiceService medicationVoiceService;

    private static final long MAX_AUDIO_SIZE = 10 * 1024 * 1024;

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

    /**
     * Voice-to-text medication schedule entry (UC B1). Returns a DRAFT the family
     * must review and confirm before it is saved via {@code POST /medications}.
     */
    @PostMapping(value = "/medications/parse-voice", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('FAMILY', 'ELDERLY')")
    public ResponseEntity<?> parseVoice(@RequestParam("audio") MultipartFile audio) throws IOException {
        if (audio == null || audio.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Audio file is required"));
        }
        if (audio.getSize() > MAX_AUDIO_SIZE) {
            return ResponseEntity.badRequest().body(Map.of("message", "Maximum audio size is 10 MB"));
        }
        String mime = audio.getContentType() != null ? audio.getContentType() : "audio/webm";
        MedicationDraftResponse draft = medicationVoiceService.parseFromAudio(audio.getBytes(), mime);
        return ResponseEntity.ok(draft);
    }
}