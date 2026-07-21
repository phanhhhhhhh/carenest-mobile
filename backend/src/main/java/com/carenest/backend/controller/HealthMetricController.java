package com.carenest.backend.controller;

import com.carenest.backend.dto.health.HealthDataSyncRequest;
import com.carenest.backend.dto.health.HealthDataSyncResponse;
import com.carenest.backend.dto.health.HealthMetricRequest;
import com.carenest.backend.dto.health.HealthMetricResponse;
import com.carenest.backend.dto.health.HealthReportResponse;
import com.carenest.backend.entity.HealthMetricType;
import com.carenest.backend.service.HealthMetricService;
import com.carenest.backend.service.HealthReportService;
import com.carenest.backend.service.HealthSyncService;
import com.carenest.backend.service.WeeklySummaryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class HealthMetricController {

    private final HealthMetricService healthMetricService;
    private final HealthReportService healthReportService;
    private final HealthSyncService healthSyncService;
    private final WeeklySummaryService weeklySummaryService;

    @PostMapping("/elderly/{elderlyId}/health-metrics")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #elderlyId)")
    public ResponseEntity<HealthMetricResponse> create(
        @PathVariable Long elderlyId,
        @Valid @RequestBody HealthMetricRequest request
    ) {
        if (!request.getElderlyId().equals(elderlyId)) {
            throw new IllegalArgumentException("elderlyId in path and body must match");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(healthMetricService.create(request));
    }

    @GetMapping("/elderly/{elderlyId}/health-metrics")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #elderlyId)")
    public ResponseEntity<List<HealthMetricResponse>> getByElderlyId(
        @PathVariable Long elderlyId,
        @RequestParam(required = false) HealthMetricType type,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to
    ) {
        if (type != null && from != null && to != null) {
            return ResponseEntity.ok(healthMetricService.getByElderlyIdAndTypeAndDateRange(elderlyId, type, from, to));
        }
        return ResponseEntity.ok(healthMetricService.getByElderlyId(elderlyId));
    }

    @GetMapping("/health-metrics/{id}")
    @PreAuthorize("@authz.canAccessHealthMetric(authentication.principal, #id)")
    public ResponseEntity<HealthMetricResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(healthMetricService.getById(id));
    }

    @PutMapping("/health-metrics/{id}")
    @PreAuthorize("@authz.canAccessHealthMetric(authentication.principal, #id)")
    public ResponseEntity<HealthMetricResponse> update(
        @PathVariable Long id,
        @Valid @RequestBody HealthMetricRequest request
    ) {
        return ResponseEntity.ok(healthMetricService.update(id, request));
    }

    @DeleteMapping("/health-metrics/{id}")
    @PreAuthorize("@authz.canAccessHealthMetric(authentication.principal, #id)")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        healthMetricService.delete(id);
        return ResponseEntity.noContent().build();
    }


    @GetMapping("/elderly/{elderlyId}/health-report")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #elderlyId)")
    public ResponseEntity<HealthReportResponse> getReport(
        @PathVariable Long elderlyId,
        @RequestParam(required = false) Set<HealthMetricType> types,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to
    ) {
        return ResponseEntity.ok(healthReportService.generateReport(elderlyId, types, from, to));
    }


    @PostMapping("/elderly/{elderlyId}/sync-health-data")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #elderlyId)")
    public ResponseEntity<HealthDataSyncResponse> syncHealthData(
        @PathVariable Long elderlyId,
        @Valid @RequestBody HealthDataSyncRequest request
    ) {
        return ResponseEntity.ok(healthSyncService.sync(elderlyId, request));
    }


    @GetMapping("/elderly/{elderlyId}/weekly-summary")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #elderlyId)")
    public ResponseEntity<?> getWeeklySummary(@PathVariable Long elderlyId) {
        var summary = weeklySummaryService.getLatestSummary(elderlyId);
        if (summary == null) {
            return ResponseEntity.noContent().build();
        }
        Map<String, Object> body = new HashMap<>();
        body.put("title", summary.getTitle());
        body.put("body", summary.getBody());
        body.put("content", summary.getBody());
        body.put("data", summary.getData());
        body.put("createdAt", summary.getCreatedAt());
        if (summary.getData() != null) {
            body.putAll(summary.getData());
        }
        return ResponseEntity.ok(body);
    }

    @PostMapping("/elderly/{elderlyId}/weekly-summary/generate")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #elderlyId)")
    public ResponseEntity<?> generateWeeklySummary(@PathVariable Long elderlyId) {
        var result = weeklySummaryService.generateWeeklySummary(elderlyId);
        Map<String, Object> body = new HashMap<>();
        body.put("message", "Weekly summary generated");
        body.put("summary", result.text());
        body.put("content", result.text());
        body.putAll(result.stats());
        return ResponseEntity.ok(body);
    }
}