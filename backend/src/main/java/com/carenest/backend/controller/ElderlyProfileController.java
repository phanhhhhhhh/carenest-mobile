package com.carenest.backend.controller;

import com.carenest.backend.dto.elderly.ElderlyProfileRequest;
import com.carenest.backend.dto.elderly.ElderlyProfileResponse;
import com.carenest.backend.service.ElderlyProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<ElderlyProfileResponse> create(
        @Valid @RequestBody ElderlyProfileRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(elderlyProfileService.create(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ElderlyProfileResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(elderlyProfileService.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ElderlyProfileResponse> update(
        @PathVariable Long id,
        @Valid @RequestBody ElderlyProfileRequest request
    ) {
        return ResponseEntity.ok(elderlyProfileService.update(id, request));
    }
}
