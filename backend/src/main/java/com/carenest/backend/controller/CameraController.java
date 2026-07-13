package com.carenest.backend.controller;

import com.carenest.backend.entity.CameraDevice;
import com.carenest.backend.entity.CameraSnapshot;
import com.carenest.backend.service.CameraService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * UC-26→33: Camera Monitoring Module REST API.
 * Integrates with Imou Open Platform for remote elderly monitoring.
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CameraController {

    private final CameraService cameraService;

    // ═══ UC-26: Link Camera ═══════════════════════════════════════════════

    @PostMapping("/elderly/{elderlyId}/cameras")
    @PreAuthorize("hasRole('FAMILY') and @authz.isOwnerOrLinkedFamily(authentication.principal, #elderlyId)")
    public ResponseEntity<Map<String, Object>> bindCamera(
        @PathVariable Long elderlyId,
        @RequestBody Map<String, String> body
    ) {
        String deviceSn = body.get("deviceSn");
        String label = body.getOrDefault("label", "Camera");
        CameraDevice device = cameraService.bindCamera(elderlyId, deviceSn, label);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "id", device.getId(),
            "deviceSn", device.getDeviceSn(),
            "label", device.getLabel(),
            "status", device.getStatus().name()
        ));
    }

    @DeleteMapping("/cameras/{deviceId}")
    @PreAuthorize("@authz.canAccessCamera(authentication.principal, #deviceId) or hasRole('ADMIN')")
    public ResponseEntity<Void> unbindCamera(@PathVariable Long deviceId) {
        cameraService.unbindCamera(deviceId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/elderly/{elderlyId}/cameras")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #elderlyId)")
    public ResponseEntity<List<Map<String, Object>>> listCameras(@PathVariable Long elderlyId) {
        List<CameraDevice> cameras = cameraService.getCamerasForElderly(elderlyId);
        return ResponseEntity.ok(cameras.stream().map(c -> Map.<String, Object>of(
            "id", c.getId(),
            "label", c.getLabel(),
            "deviceSn", c.getDeviceSn(),
            "status", c.getStatus().name(),
            "privacyMode", c.isPrivacyMode(),
            "motionDetectionEnabled", c.isMotionDetectionEnabled(),
            "snapshotSchedule", c.getSnapshotSchedule() != null ? c.getSnapshotSchedule() : ""
        )).collect(Collectors.toList()));
    }

    // ═══ UC-27: Live View ═════════════════════════════════════════════════

    @GetMapping("/cameras/{deviceId}/live")
    @PreAuthorize("@authz.canAccessCamera(authentication.principal, #deviceId) or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getLiveStream(@PathVariable Long deviceId) {
        return ResponseEntity.ok(cameraService.getLiveStreamUrl(deviceId));
    }

    // ═══ UC-28: SOS Snapshot ══════════════════════════════════════════════

    @PostMapping("/elderly/{elderlyId}/cameras/snapshot")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #elderlyId)")
    public ResponseEntity<Map<String, Object>> captureSnapshot(
        @PathVariable Long elderlyId,
        @RequestBody Map<String, Object> body
    ) {
        Long emergencyEventId = body.get("emergencyEventId") != null
            ? Long.valueOf(body.get("emergencyEventId").toString()) : null;
        CameraSnapshot snapshot = cameraService.captureSosSnapshot(elderlyId, emergencyEventId);
        if (snapshot == null) {
            return ResponseEntity.ok(Map.of("status", "NO_CAMERA", "message", "No camera bound"));
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "id", snapshot.getId(),
            "imageUrl", snapshot.getImageUrl() != null ? snapshot.getImageUrl() : "",
            "success", snapshot.isSuccess(),
            "errorMessage", snapshot.getErrorMessage() != null ? snapshot.getErrorMessage() : ""
        ));
    }

    // ═══ UC-29: Check-in Timeline ═════════════════════════════════════════

    @GetMapping("/elderly/{elderlyId}/camera-timeline")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #elderlyId)")
    public ResponseEntity<Map<String, Object>> getTimeline(
        @PathVariable Long elderlyId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Page<CameraSnapshot> snapshots = cameraService.getCheckInTimeline(elderlyId, page, size);
        return ResponseEntity.ok(Map.of(
            "snapshots", snapshots.getContent().stream().map(s -> Map.of(
                "id", s.getId(),
                "imageUrl", s.getImageUrl() != null ? s.getImageUrl() : "",
                "trigger", s.getTrigger().name(),
                "success", s.isSuccess(),
                "createdAt", s.getCreatedAt()
            )).collect(Collectors.toList()),
            "page", page,
            "size", size,
            "total", snapshots.getTotalElements(),
            "hasMore", snapshots.hasNext()
        ));
    }

    // ═══ UC-30: Motion Detection ══════════════════════════════════════════

    @PutMapping("/cameras/{deviceId}/motion-detection")
    @PreAuthorize("@authz.canAccessCamera(authentication.principal, #deviceId) or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> configureMotionDetection(
        @PathVariable Long deviceId,
        @RequestBody Map<String, String> body
    ) {
        boolean enabled = Boolean.parseBoolean(body.getOrDefault("enabled", "false"));
        String windowStart = body.getOrDefault("monitoringWindowStart", null);
        String windowEnd = body.getOrDefault("monitoringWindowEnd", null);
        cameraService.configureMotionDetection(deviceId, enabled, windowStart, windowEnd);
        return ResponseEntity.ok(Map.of(
            "message", "Motion detection settings updated",
            "enabled", enabled,
            "monitoringWindowStart", windowStart != null ? windowStart : "",
            "monitoringWindowEnd", windowEnd != null ? windowEnd : ""
        ));
    }

    // ═══ UC-31: Two-Way Voice ═════════════════════════════════════════════

    @PostMapping("/cameras/{deviceId}/voice/start")
    @PreAuthorize("@authz.canAccessCamera(authentication.principal, #deviceId) or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> startVoiceCall(@PathVariable Long deviceId) {
        return ResponseEntity.ok(cameraService.startTwoWayAudio(deviceId));
    }

    @PostMapping("/cameras/{deviceId}/voice/stop")
    @PreAuthorize("@authz.canAccessCamera(authentication.principal, #deviceId) or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> stopVoiceCall(@PathVariable Long deviceId) {
        return ResponseEntity.ok(cameraService.stopTwoWayAudio(deviceId));
    }

    // ═══ UC-32: Privacy Mode ══════════════════════════════════════════════

    @PostMapping("/cameras/{deviceId}/privacy")
    @PreAuthorize("hasRole('ELDERLY') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> togglePrivacy(
        @PathVariable Long deviceId,
        @RequestBody Map<String, Boolean> body
    ) {
        boolean enabled = body.getOrDefault("enabled", true);
        return ResponseEntity.ok(cameraService.setPrivacyMode(deviceId, enabled));
    }

    // ═══ UC-33: Connection Status ═════════════════════════════════════════

    @GetMapping("/cameras/{deviceId}/status")
    @PreAuthorize("@authz.canAccessCamera(authentication.principal, #deviceId) or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getStatus(@PathVariable Long deviceId) {
        return ResponseEntity.ok(cameraService.getCameraStatus(deviceId));
    }

    @GetMapping("/elderly/{elderlyId}/camera-status")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #elderlyId)")
    public ResponseEntity<Map<String, Object>> getElderlyCameraStatus(@PathVariable Long elderlyId) {
        List<CameraDevice> cameras = cameraService.getCamerasForElderly(elderlyId);
        if (cameras.isEmpty()) {
            return ResponseEntity.ok(Map.of("hasCamera", false, "message", "No cameras linked"));
        }
        // Return aggregate status for the elderly portal
        boolean allOnline = cameras.stream().allMatch(CameraDevice::isOnline);
        boolean anyPrivacy = cameras.stream().anyMatch(CameraDevice::isPrivacyMode);
        return ResponseEntity.ok(Map.of(
            "hasCamera", true,
            "cameraCount", cameras.size(),
            "allOnline", allOnline,
            "indicatorColor", anyPrivacy ? "GRAY" : (allOnline ? "GREEN" : "RED"),
            "statusText", anyPrivacy ? "Privacy mode active" : (allOnline ? "All cameras connected" : "Some cameras offline")
        ));
    }
}
