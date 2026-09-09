package com.carenest.backend.dto.camera;

import com.carenest.backend.entity.CameraDevice;

import java.util.Arrays;
import java.util.List;

public record CameraDeviceResponse(
    Long id,
    String deviceSn,
    String label,
    String status,
    boolean privacyMode,
    boolean motionDetectionEnabled,
    String snapshotSchedule,
    List<String> capabilities
) {
    public static CameraDeviceResponse from(CameraDevice camera) {
        List<String> capabilities = camera.getCapabilities() == null || camera.getCapabilities().isBlank()
            ? List.of()
            : Arrays.stream(camera.getCapabilities().split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .toList();
        return new CameraDeviceResponse(
            camera.getId(),
            camera.getDeviceSn(),
            camera.getLabel(),
            camera.getStatus().name(),
            camera.isPrivacyMode(),
            camera.isMotionDetectionEnabled(),
            camera.getSnapshotSchedule() == null ? "" : camera.getSnapshotSchedule(),
            capabilities);
    }
}
