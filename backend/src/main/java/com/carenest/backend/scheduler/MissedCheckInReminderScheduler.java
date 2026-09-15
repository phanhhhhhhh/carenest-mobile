package com.carenest.backend.scheduler;

import com.carenest.backend.entity.User;
import com.carenest.backend.entity.UserRole;
import com.carenest.backend.repository.CheckInRepository;
import com.carenest.backend.repository.UserRepository;
import com.carenest.backend.service.FcmService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * CN-CORE-02: Scheduled morning missed check-in reminder before 09:00 (Spec v3.5 UC A1 / Gap #5).
 * Runs daily at 08:30 ICT to gently nudge elderly users who have not checked in today.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MissedCheckInReminderScheduler {

    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final UserRepository userRepository;
    private final CheckInRepository checkInRepository;
    private final FcmService fcmService;

    @Scheduled(cron = "0 30 8 * * *", zone = "Asia/Ho_Chi_Minh")
    public void sendMorningCheckInReminders() {
        log.info("Starting scheduled morning missed check-in reminders check");
        LocalDate today = LocalDate.now(VIETNAM_ZONE);
        OffsetDateTime startOfDay = today.atStartOfDay(VIETNAM_ZONE).toOffsetDateTime();
        OffsetDateTime now = OffsetDateTime.now(VIETNAM_ZONE);

        Set<Long> checkedInElderlyIds = checkInRepository.findElderlyIdsWithCheckInBetween(startOfDay, now);
        List<User> elderlyUsers = userRepository.findByRoleAndDeletedAtIsNull(UserRole.ELDERLY);

        int remindedCount = 0;
        for (User elderly : elderlyUsers) {
            if (!checkedInElderlyIds.contains(elderly.getId())) {
                try {
                    fcmService.sendToUser(
                        elderly.getId(),
                        "Chào buổi sáng ông/bà ☀️",
                        "Hôm nay ông/bà cảm thấy thế nào? Hãy chạm vào đây để báo tin cho con cháu nhé.",
                        Map.of(
                            "type", "CHECK_IN_REMINDER",
                            "elderlyId", String.valueOf(elderly.getId())
                        )
                    );
                    remindedCount++;
                } catch (Exception ex) {
                    log.error("Failed to send morning check-in reminder to elderlyId={}", elderly.getId(), ex);
                }
            }
        }
        log.info("Sent morning check-in reminders to {} elderly users out of {} active elderly", remindedCount, elderlyUsers.size());
    }
}
