package com.carenest.backend.dto.camera;

import java.time.Instant;

public record CameraLiveStreamResponse(
    Long cameraId,
    String label,
    String status,
    Instant confirmedAt,
    Instant lastSeenAt,
    String playbackProtocol,
    String contentType,
    Integer streamId,
    String streamUrl
) {}
