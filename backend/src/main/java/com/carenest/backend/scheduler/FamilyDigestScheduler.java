package com.carenest.backend.scheduler;

import com.carenest.backend.service.FamilyDigestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Fires the AI Family Digest once a day at 20:00 ICT (UC A6). */
@Slf4j
@Component
@RequiredArgsConstructor
public class FamilyDigestScheduler {

    private final FamilyDigestService familyDigestService;

    @Value("${carenest.digest.enabled:true}")
    private boolean enabled;

    @Scheduled(cron = "${carenest.digest.cron:0 0 20 * * *}", zone = "Asia/Ho_Chi_Minh")
    public void runDailyDigest() {
        if (!enabled) {
            return;
        }
        log.info("FamilyDigestScheduler: starting 20:00 digest run");
        try {
            int count = familyDigestService.generateAll();
            log.info("FamilyDigestScheduler: done — {} digests", count);
        } catch (Exception e) {
            log.error("FamilyDigestScheduler: run failed", e);
        }
    }
}
