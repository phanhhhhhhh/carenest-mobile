package com.carenest.backend.service;

import com.carenest.backend.entity.FamilyLink;
import com.carenest.backend.entity.FamilyLinkStatus;
import com.carenest.backend.entity.HealthMetric;
import com.carenest.backend.entity.HealthMetricType;
import com.carenest.backend.entity.MedicationLog;
import com.carenest.backend.entity.MedicationLogStatus;
import com.carenest.backend.entity.Notification;
import com.carenest.backend.entity.NotificationType;
import com.carenest.backend.entity.User;
import com.carenest.backend.repository.FamilyLinkRepository;
import com.carenest.backend.repository.HealthMetricRepository;
import com.carenest.backend.repository.MedicationLogRepository;
import com.carenest.backend.repository.NotificationRepository;
import com.carenest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class WeeklySummaryService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM");

    private final UserRepository userRepository;
    private final HealthMetricRepository healthMetricRepository;
    private final MedicationLogRepository medicationLogRepository;
    private final FamilyLinkRepository familyLinkRepository;
    private final NotificationRepository notificationRepository;
    private final FcmService fcmService;

    /**
     * Generate weekly health summary for one elderly user.
     */
    public String generateWeeklySummary(Long elderlyId) {
        User elderly = userRepository.findById(elderlyId).orElse(null);
        if (elderly == null) return null;

        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime weekStart = now.minusDays(7);

        List<HealthMetric> metrics = healthMetricRepository
            .findAllByElderlyIdAndDateRange(elderlyId, weekStart, now);

        List<MedicationLog> logs = medicationLogRepository
            .findAllByElderlyIdAndDateRange(elderlyId, weekStart, now);

        String summary = buildSummaryText(elderly.getName(), metrics, logs, weekStart, now);

        // Save as notification for the elderly
        Notification notif = Notification.builder()
            .user(elderly)
            .type(NotificationType.FAMILY_UPDATE)
            .title("📊 Weekly Health Summary")
            .body(summary)
            .data(Map.of(
                "type", "WEEKLY_SUMMARY",
                "elderlyId", elderlyId.toString(),
                "weekStart", weekStart.toString(),
                "weekEnd", now.toString()
            ))
            .build();
        notificationRepository.save(notif);

        // Push to elderly
        fcmService.sendToUser(elderlyId,
            "📊 Your Weekly Health Summary",
            buildShortSummary(metrics, logs),
            Map.of("type", "WEEKLY_SUMMARY"));

        // Push to all linked family members
        List<FamilyLink> familyLinks = familyLinkRepository
            .findAllFamilyByElderlyIdAndStatus(elderlyId, FamilyLinkStatus.ACTIVE);

        for (FamilyLink fl : familyLinks) {
            Notification familyNotif = Notification.builder()
                .user(fl.getFamily())
                .type(NotificationType.FAMILY_UPDATE)
                .title("📊 Weekly Summary: " + elderly.getName())
                .body(summary)
                .data(Map.of(
                    "type", "WEEKLY_SUMMARY",
                    "elderlyId", elderlyId.toString(),
                    "weekStart", weekStart.toString(),
                    "weekEnd", now.toString()
                ))
                .build();
            notificationRepository.save(familyNotif);

            fcmService.sendToUser(fl.getFamily().getId(),
                "📊 Weekly Summary: " + elderly.getName(),
                buildShortSummary(metrics, logs),
                Map.of("type", "WEEKLY_SUMMARY", "elderlyId", elderlyId.toString()));
        }

        log.info("Weekly summary generated for elderlyId={}, familyCount={}",
            elderlyId, familyLinks.size());
        return summary;
    }

    /**
     * Generate weekly summaries for ALL elderly users.
     * Called by the scheduler.
     */
    public int generateAllSummaries() {
        List<User> elderlyUsers = userRepository.findAll()
            .stream()
            .filter(u -> u.getDeletedAt() == null
                && u.getRole() == com.carenest.backend.entity.UserRole.ELDERLY)
            .collect(Collectors.toList());

        int count = 0;
        for (User elderly : elderlyUsers) {
            try {
                generateWeeklySummary(elderly.getId());
                count++;
            } catch (Exception e) {
                log.error("Failed to generate summary for elderlyId={}: {}",
                    elderly.getId(), e.getMessage());
            }
        }
        log.info("Generated {} weekly summaries", count);
        return count;
    }

    /**
     * Get the latest weekly summary notification for an elderly user.
     */
    @Transactional(readOnly = true)
    public Notification getLatestSummary(Long elderlyId) {
        return notificationRepository
            .findByUserIdOrderByCreatedAtDesc(elderlyId, PageRequest.of(0, 20))
            .stream()
            .filter(n -> n.getData() != null
                && "WEEKLY_SUMMARY".equals(n.getData().get("type")))
            .findFirst()
            .orElse(null);
    }

    // ── Summary Text Generation (template-based, AI-pluggable) ──────────────

    /**
     * Generate a detailed English summary.
     *
     * This method is designed to be replaced with an AI/LLM call
     * (e.g., OpenAI, Claude) without changing the rest of the system.
     * The AI prompt would receive the same data map and return generated text.
     */
    private String buildSummaryText(String name, List<HealthMetric> metrics,
                                     List<MedicationLog> logs,
                                     OffsetDateTime from, OffsetDateTime to) {
        StringBuilder sb = new StringBuilder();
        String weekLabel = from.format(DATE_FMT) + " - " + to.format(DATE_FMT);

        sb.append("📅 Week: ").append(weekLabel).append("\n");
        sb.append("👤 ").append(name).append("\n\n");

        // ── Health Metrics Summary ──────────────────────────────────────
        Map<HealthMetricType, List<HealthMetric>> byType = metrics.stream()
            .collect(Collectors.groupingBy(HealthMetric::getType, LinkedHashMap::new, Collectors.toList()));

        if (!byType.isEmpty()) {
            sb.append("💓 Health Metrics:\n");
            for (var entry : byType.entrySet()) {
                String label = formatType(entry.getKey());
                List<BigDecimal> values = entry.getValue().stream()
                    .map(HealthMetric::getValue)
                    .sorted()
                    .collect(Collectors.toList());

                BigDecimal avg = values.stream()
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(values.size()), 1, RoundingMode.HALF_UP);
                BigDecimal min = values.get(0);
                BigDecimal max = values.get(values.size() - 1);

                sb.append("  • ").append(label).append(": TB ")
                    .append(avg).append(", min ").append(min)
                    .append(", max ").append(max);
                if (entry.getValue().get(0).getUnit() != null) {
                    sb.append(" ").append(entry.getValue().get(0).getUnit());
                }
                sb.append(" (").append(values.size()).append(" readings)\n");
            }
            sb.append("\n");
        } else {
            sb.append("⚠️ No health data recorded this week.\n\n");
        }

        // ── Medication Adherence ────────────────────────────────────────
        long taken = logs.stream().filter(l -> l.getStatus() == MedicationLogStatus.TAKEN).count();
        long missed = logs.stream().filter(l -> l.getStatus() == MedicationLogStatus.MISSED).count();
        long total = taken + missed;
        long skipped = logs.stream().filter(l -> l.getStatus() == MedicationLogStatus.SKIPPED).count();

        if (total > 0) {
            double rate = (double) taken / total * 100;
            sb.append("💊 Medication Adherence:\n");
            sb.append("  • Taken: ").append(taken).append(" times\n");
            if (missed > 0) sb.append("  • Missed: ").append(missed).append(" times\n");
            if (skipped > 0) sb.append("  • Skipped: ").append(skipped).append(" times\n");
            sb.append("  • Rate: ").append(String.format("%.0f%%", rate));
            if (rate >= 90) sb.append(" ✅ Excellent!");
            else if (rate >= 70) sb.append(" ⚠️ Needs attention");
            else sb.append(" 🔴 Needs immediate improvement");
            sb.append("\n\n");
        }

        // ── Trend Comparison ────────────────────────────────────────────
        // Compare this week's averages to last week's
        OffsetDateTime twoWeeksAgo = from.minusDays(7);
        List<HealthMetric> prevMetrics = healthMetricRepository
            .findAllByElderlyIdAndDateRange(
                metrics.isEmpty() ? 0L : metrics.get(0).getElderly().getId(),
                twoWeeksAgo, from);

        Map<HealthMetricType, BigDecimal> thisWeekAvgs = byType.entrySet().stream()
            .collect(Collectors.toMap(Map.Entry::getKey,
                e -> e.getValue().stream().map(HealthMetric::getValue)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(e.getValue().size()), 1, RoundingMode.HALF_UP)));

        Map<HealthMetricType, BigDecimal> prevWeekAvgs = prevMetrics.stream()
            .collect(Collectors.groupingBy(HealthMetric::getType))
            .entrySet().stream()
            .collect(Collectors.toMap(Map.Entry::getKey,
                e -> e.getValue().stream().map(HealthMetric::getValue)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(e.getValue().size()), 1, RoundingMode.HALF_UP)));

        if (!prevWeekAvgs.isEmpty()) {
            sb.append("📈 vs. Previous Week:\n");
            for (var entry : thisWeekAvgs.entrySet()) {
                BigDecimal prev = prevWeekAvgs.get(entry.getKey());
                if (prev == null || prev.compareTo(BigDecimal.ZERO) == 0) continue;
                BigDecimal change = entry.getValue().subtract(prev)
                    .divide(prev, 2, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));

                String arrow = change.compareTo(BigDecimal.ZERO) > 0 ? "↑" : "↓";
                sb.append("  • ").append(formatType(entry.getKey()))
                    .append(": ").append(arrow).append(" ")
                    .append(change.abs()).append("%\n");
            }
            sb.append("\n");
        }

        sb.append("📱 Open CareNest app for details.\n");
        sb.append("— CareNest AI 🤖");

        return sb.toString();
    }

    private String buildShortSummary(List<HealthMetric> metrics, List<MedicationLog> logs) {
        long taken = logs.stream().filter(l -> l.getStatus() == MedicationLogStatus.TAKEN).count();
        long total = taken + logs.stream().filter(l -> l.getStatus() == MedicationLogStatus.MISSED).count();
        String medStatus = total > 0
            ? "Adherence: " + (taken * 100 / total) + "%"
            : "No medication data";

        return "View your weekly health summary. " + medStatus + ". Open the app for details.";
    }

    private String formatType(HealthMetricType type) {
        return switch (type) {
            case BLOOD_PRESSURE -> "Blood Pressure";
            case HEART_RATE -> "Heart Rate";
            case BLOOD_GLUCOSE -> "Blood Glucose";
            case WEIGHT -> "Weight";
            case TEMPERATURE -> "Temperature";
            case SPO2 -> "SpO2";
        };
    }
}
