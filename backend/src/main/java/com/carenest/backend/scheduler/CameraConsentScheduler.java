package com.carenest.backend.scheduler;

import com.carenest.backend.service.CameraConsentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Fires the single 30-day camera-consent re-ask for declined profiles (UC D1). */
@Slf4j
@Component
@RequiredArgsConstructor
public class CameraConsentScheduler {

    private final CameraConsentService cameraConsentService;

    @Scheduled(cron = "0 15 9 * * *", zone = "Asia/Ho_Chi_Minh")
    public void runConsentRetries() {
        try {
            cameraConsentService.runConsentRetries();
        } catch (Exception e) {
            log.error("Camera consent retry run failed", e);
        }
    }
}
