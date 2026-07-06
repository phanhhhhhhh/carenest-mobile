package com.carenest.backend.controller;

import com.carenest.backend.dto.health.HealthMetricThresholdRequest;
import com.carenest.backend.dto.health.HealthMetricThresholdResponse;
import com.carenest.backend.service.HealthMetricThresholdService;
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
public class HealthMetricThresholdController {

    private final HealthMetricThresholdService thresholdService;

    @PostMapping("/users/{userId}/health-thresholds")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #userId)")
    public ResponseEntity<HealthMetricThresholdResponse> create(
        @PathVariable Long userId,
        @Valid @RequestBody HealthMetricThresholdRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(thresholdService.create(userId, request));
    }

    @GetMapping("/users/{userId}/health-thresholds")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #userId)")
    public ResponseEntity<List<HealthMetricThresholdResponse>> getByUserId(
        @PathVariable Long userId
    ) {
        return ResponseEntity.ok(thresholdService.getByElderlyId(userId));
    }

    @PatchMapping("/health-thresholds/{id}")
    @PreAuthorize("@authz.canAccessHealthThreshold(authentication.principal, #id)")
    public ResponseEntity<HealthMetricThresholdResponse> update(
        @PathVariable Long id,
        @Valid @RequestBody HealthMetricThresholdRequest request
    ) {
        return ResponseEntity.ok(thresholdService.update(id, request));
    }

    @DeleteMapping("/health-thresholds/{id}")
    @PreAuthorize("@authz.canAccessHealthThreshold(authentication.principal, #id)")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        thresholdService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * UC-11: Get Gemini AI-powered personalized threshold recommendations
     * based on the elderly's health profile.
     */
    @GetMapping("/users/{userId}/health-thresholds/recommend")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #userId)")
    public ResponseEntity<java.util.Map<String, Object>> recommendThresholds(
        @PathVariable Long userId
    ) {
        return ResponseEntity.ok(thresholdService.recommendThresholds(userId));
    }
}
