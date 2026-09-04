package com.carenest.backend.scheduler;

import com.carenest.backend.service.CameraTokenRefreshService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CameraTokenRefreshScheduler {

    private final CameraTokenRefreshService cameraTokenRefreshService;

    @Scheduled(
        fixedDelayString = "${imou.token-refresh.fixed-delay:86400000}",
        initialDelayString = "${imou.token-refresh.initial-delay:86400000}"
    )
    public void refreshCameraTokens() {
        cameraTokenRefreshService.refreshTokens();
    }
}
