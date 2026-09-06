package com.carenest.backend.service;

import com.carenest.backend.entity.CheckIn;
import com.carenest.backend.entity.EmergencyEvent;
import com.carenest.backend.entity.FamilyLink;
import com.carenest.backend.entity.FamilyLinkStatus;
import com.carenest.backend.entity.FamilyVisit;
import com.carenest.backend.entity.MedicationLog;
import com.carenest.backend.entity.MedicationLogStatus;
import com.carenest.backend.entity.Notification;
import com.carenest.backend.entity.NotificationType;
import com.carenest.backend.entity.User;
import com.carenest.backend.entity.UserRole;
import com.carenest.backend.repository.CheckInRepository;
import com.carenest.backend.repository.EmergencyEventRepository;
import com.carenest.backend.repository.FamilyLinkRepository;
import com.carenest.backend.repository.FamilyVisitRepository;
import com.carenest.backend.repository.MedicationLogRepository;
import com.carenest.backend.repository.NotificationRepository;
import com.carenest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * AI Family Digest (UC A6): one warm end-of-day narrative summary per family.
 * Runs once at 20:00 ICT, makes at most ONE Gemini request per family per day
 * (spec target), and stores the result as a family-accessible notification.
 * When the day had nothing worth noting it produces a short no-update digest
 * rather than inventing events; when Gemini is unavailable it falls back to a
 * plain template summary.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FamilyDigestService {

    private static final ZoneId ICT = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter DAY_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    public static final String DIGEST_TYPE = "DAILY_DIGEST";

    private final CheckInRepository checkInRepository;
    private final MedicationLogRepository medicationLogRepository;
    private final EmergencyEventRepository emergencyEventRepository;
    private final FamilyVisitRepository familyVisitRepository;
    private final FamilyLinkRepository familyLinkRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final GeminiApiService geminiApiService;
    private final FcmService fcmService;

    public record GeneratedDigest(String text, boolean quietDay, boolean aiGenerated) {}

    /** Generate + deliver a digest for every elderly profile that has active family. */
    @Transactional
    public int generateAll() {
        int page = 0;
        int count = 0;
        org.springframework.data.domain.Page<User> batch;
        do {
            batch = userRepository.findByRoleAndDeletedAtIsNull(UserRole.ELDERLY, PageRequest.of(page, 50));
            for (User elderly : batch.getContent()) {
                try {
                    if (generateForElderly(elderly.getId(), LocalDate.now(ICT)) != null) {
                        count++;
                    }
                } catch (Exception e) {
                    log.error("Family digest failed for elderlyId={}: {}", elderly.getId(), e.getMessage(), e);
                }
            }
            page++;
        } while (batch.hasNext());
        log.info("Family digest run complete — {} digests generated", count);
        return count;
    }

    @Transactional
    public GeneratedDigest generateForElderly(Long elderlyId, LocalDate day) {
        User elderly = userRepository.findById(elderlyId).orElse(null);
        if (elderly == null) {
            return null;
        }
        List<FamilyLink> links = familyLinkRepository
            .findAllFamilyByElderlyIdAndStatus(elderlyId, FamilyLinkStatus.ACTIVE);
        if (links.isEmpty()) {
            return null; // no family to read it
        }

        OffsetDateTime from = day.atStartOfDay(ICT).toOffsetDateTime();
        OffsetDateTime to = from.plusDays(1);

        List<CheckIn> checkIns = checkInRepository
            .findByElderlyIdAndCreatedAtBetweenOrderByCreatedAtDesc(elderlyId, from, to);
        List<MedicationLog> medLogs = medicationLogRepository
            .findAllByElderlyIdAndDateRange(elderlyId, from, to);
        List<EmergencyEvent> emergencies = emergencyEventRepository
            .findByElderlyIdOrderByTriggeredAtDesc(elderlyId).stream()
            .filter(e -> e.getTriggeredAt() != null
                && !e.getTriggeredAt().isBefore(from) && e.getTriggeredAt().isBefore(to))
            .toList();
        List<FamilyVisit> visits = familyVisitRepository.findInRange(elderlyId, from, to);

        boolean quietDay = checkIns.isEmpty() && medLogs.isEmpty()
            && emergencies.isEmpty() && visits.isEmpty();

        String data = buildDataContext(elderly.getName(), day, checkIns, medLogs, emergencies, visits, quietDay);

        String text;
        boolean aiGenerated = false;
        if (geminiApiService.isAvailable()) {
            try {
                text = geminiApiService.generateContent(systemPrompt(), data, 0.6, 1024);
                aiGenerated = true;
            } catch (Exception e) {
                log.warn("Gemini digest failed for elderlyId={}, using template: {}", elderlyId, e.getMessage());
                text = templateDigest(elderly.getName(), day, checkIns, medLogs, emergencies, visits, quietDay);
            }
        } else {
            text = templateDigest(elderly.getName(), day, checkIns, medLogs, emergencies, visits, quietDay);
        }

        String title = "Bản tin gia đình — " + day.format(DAY_FMT);
        Map<String, Object> notifData = Map.of(
            "type", DIGEST_TYPE,
            "elderlyId", elderlyId.toString(),
            "date", day.toString(),
            "quietDay", Boolean.toString(quietDay));

        for (FamilyLink link : links) {
            notificationRepository.save(Notification.builder()
                .user(link.getFamily())
                .type(NotificationType.FAMILY_UPDATE)
                .title(title)
                .body(text)
                .data(notifData)
                .build());
            fcmService.sendToUser(link.getFamily().getId(), title,
                quietDay ? "Một ngày bình yên." : "Chạm để đọc tóm tắt ngày hôm nay.",
                Map.of("type", DIGEST_TYPE, "elderlyId", elderlyId.toString()));
        }

        log.info("Family digest stored for elderlyId={} ({} recipients, quiet={}, ai={})",
            elderlyId, links.size(), quietDay, aiGenerated);
        return new GeneratedDigest(text, quietDay, aiGenerated);
    }

    @Transactional(readOnly = true)
    public Notification getLatestForUser(Long familyUserId) {
        return notificationRepository
            .findByUserIdOrderByCreatedAtDesc(familyUserId, PageRequest.of(0, 30))
            .stream()
            .filter(n -> n.getData() != null && DIGEST_TYPE.equals(n.getData().get("type")))
            .findFirst()
            .orElse(null);
    }

    // --- content ------------------------------------------------------------

    private String systemPrompt() {
        return """
            You write CareNest's end-of-day Family Digest: one short, warm Vietnamese
            paragraph (or a few short lines) that a busy adult child reads at night to
            know how their elderly parent's day went.

            RULES:
            - Use ONLY the facts provided. Never invent events, numbers, or medical conclusions.
            - No diagnosis, no alarming language. If something needs attention, mention it calmly.
            - Warm, plain Vietnamese. 60-120 words. A gentle closing line is fine.
            - If the day had no recorded activity, say so briefly and kindly — do not pad it.
            """;
    }

    private String buildDataContext(String name, LocalDate day, List<CheckIn> checkIns,
                                    List<MedicationLog> medLogs, List<EmergencyEvent> emergencies,
                                    List<FamilyVisit> visits, boolean quietDay) {
        StringBuilder sb = new StringBuilder();
        sb.append("Người thân: ").append(name).append("\nNgày: ").append(day.format(DAY_FMT)).append("\n\n");

        if (quietDay) {
            sb.append("Hôm nay không có hoạt động nào được ghi nhận.\n");
            return sb.toString();
        }

        sb.append("CHECK-IN:\n");
        if (checkIns.isEmpty()) {
            sb.append("- Chưa check-in hôm nay.\n");
        } else {
            for (CheckIn c : checkIns) {
                sb.append("- ").append(moodWord(c.getMood()))
                    .append(c.getNote() != null && !c.getNote().isBlank() ? " (\"" + c.getNote() + "\")" : "")
                    .append("\n");
            }
        }

        long taken = medLogs.stream().filter(l -> l.getStatus() == MedicationLogStatus.TAKEN).count();
        long missed = medLogs.stream().filter(l -> l.getStatus() == MedicationLogStatus.MISSED).count();
        long skipped = medLogs.stream().filter(l -> l.getStatus() == MedicationLogStatus.SKIPPED).count();
        sb.append("\nTHUỐC: đã uống ").append(taken).append(", bỏ lỡ ").append(missed)
            .append(", bỏ qua ").append(skipped).append("\n");

        if (!visits.isEmpty()) {
            sb.append("\nVỀ THĂM:\n");
            for (FamilyVisit v : visits) {
                sb.append("- ").append(v.getMember().getName()).append(" đã về thăm nhà\n");
            }
        }

        if (!emergencies.isEmpty()) {
            sb.append("\nKHẨN CẤP:\n");
            for (EmergencyEvent e : emergencies) {
                sb.append("- SOS lúc ").append(e.getTriggeredAt().atZoneSameInstant(ICT).toLocalTime())
                    .append(e.getResolvedAt() != null ? " (đã xử lý)" : " (chưa xử lý)").append("\n");
            }
        }
        return sb.toString();
    }

    private String templateDigest(String name, LocalDate day, List<CheckIn> checkIns,
                                  List<MedicationLog> medLogs, List<EmergencyEvent> emergencies,
                                  List<FamilyVisit> visits, boolean quietDay) {
        if (quietDay) {
            return "Hôm nay (" + day.format(DAY_FMT) + ") không có hoạt động nào được ghi nhận cho "
                + name + ". Một ngày bình yên.";
        }
        StringBuilder sb = new StringBuilder("Bản tin ngày ").append(day.format(DAY_FMT))
            .append(" của ").append(name).append(":\n");
        if (!checkIns.isEmpty()) {
            sb.append("• Tâm trạng: ").append(moodWord(checkIns.get(0).getMood())).append("\n");
        } else {
            sb.append("• Chưa check-in hôm nay.\n");
        }
        long taken = medLogs.stream().filter(l -> l.getStatus() == MedicationLogStatus.TAKEN).count();
        long missed = medLogs.stream().filter(l -> l.getStatus() == MedicationLogStatus.MISSED).count();
        if (!medLogs.isEmpty()) {
            sb.append("• Thuốc: uống ").append(taken).append(", bỏ lỡ ").append(missed).append("\n");
        }
        for (FamilyVisit v : visits) {
            sb.append("• ").append(v.getMember().getName()).append(" đã về thăm nhà\n");
        }
        if (!emergencies.isEmpty()) {
            sb.append("• Có ").append(emergencies.size()).append(" tín hiệu SOS hôm nay — hãy kiểm tra mục Cảnh báo.\n");
        }
        return sb.toString().trim();
    }

    private static String moodWord(Short mood) {
        if (mood == null) return "bình thường";
        return switch (mood.intValue()) {
            case 1 -> "khỏe mạnh";
            case 2 -> "bình thường";
            case 3 -> "thấy mệt";
            case 4 -> "cần giúp gấp";
            default -> "bình thường";
        };
    }
}
