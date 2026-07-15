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
import java.util.LinkedHashMap;
import java.util.List;
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
    private final GeminiApiService geminiApiService;

    
    public String generateWeeklySummary(Long elderlyId) {
        User elderly = userRepository.findById(elderlyId).orElse(null);
        if (elderly == null)
            return null;

        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime weekStart = now.minusDays(7);

        List<HealthMetric> metrics = healthMetricRepository
                .findAllByElderlyIdAndDateRange(elderlyId, weekStart, now);

        List<MedicationLog> logs = medicationLogRepository
                .findAllByElderlyIdAndDateRange(elderlyId, weekStart, now);

        String aiSummary = buildAiSummary(elderly, metrics, logs, weekStart, now);
        String summary = (aiSummary != null) ? aiSummary
                : buildSummaryText(elderly.getName(), metrics, logs, weekStart, now);

        Notification notif = Notification.builder()
                .user(elderly)
                .type(NotificationType.FAMILY_UPDATE)
                .title("📊 Weekly Health Summary")
                .body(summary)
                .data(Map.of(
                        "type", "WEEKLY_SUMMARY",
                        "elderlyId", elderlyId.toString(),
                        "weekStart", weekStart.toString(),
                        "weekEnd", now.toString()))
                .build();
        notificationRepository.save(notif);

        fcmService.sendToUser(elderlyId,
                "📊 Your Weekly Health Summary",
                buildShortSummary(metrics, logs),
                Map.of("type", "WEEKLY_SUMMARY"));

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
                            "weekEnd", now.toString()))
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


    
    private String buildAiSummary(User elderly, List<HealthMetric> metrics,
            List<MedicationLog> logs,
            OffsetDateTime from, OffsetDateTime to) {
        if (!geminiApiService.isAvailable()) {
            log.debug("Gemini API not available — using template summary for elderlyId={}", elderly.getId());
            return null;
        }

        try {
            String systemPrompt = buildAiSystemPrompt();
            String dataContext = buildAiDataContext(elderly, metrics, logs, from, to);
            return geminiApiService.generateContent(systemPrompt, dataContext, 0.5, 2048);
        } catch (Exception e) {
            log.warn("Gemini AI summary failed for elderlyId={}: {}", elderly.getId(), e.getMessage());
            return null;
        }
    }

    private String buildAiSystemPrompt() {
        return """
                You are a caring health assistant for CareNest, an elderly care platform.
                Your task: write a warm, personalized weekly health summary for a family
                member to read about their elderly loved one.

                === TONE GUIDELINES ===
                - Warm and caring, like a family doctor writing to concerned children
                - Use simple language (the reader may not have medical training)
                - Celebrate good trends, gently flag concerns
                - NEVER diagnose or cause panic — always frame concerns constructively
                - Include specific numbers (averages, percentages)
                - Use emoji for visual warmth (📊 💓 💊 📈 ⚠️ ✅)
                - Structure with clear sections
                - Keep under 500 words

                === OUTPUT FORMAT ===
                1. Opening greeting with the elderly person's name and the week dates
                2. 💓 Health Metrics section: each metric with average, min, max, trend arrow
                3. 💊 Medication Adherence section: rate, missed doses, rating
                4. 📈 Week-over-Week Comparison: what improved, what needs attention
                5. ⚠️ Alerts/Concerns section (if any flagged metrics)
                6. Closing message with warmth and recommendation to check the app

                Do NOT use markdown headers (##). Use emoji-prefixed lines instead.
                """;
    }

    private String buildAiDataContext(User elderly, List<HealthMetric> metrics,
            List<MedicationLog> logs,
            OffsetDateTime from, OffsetDateTime to) {
        StringBuilder ctx = new StringBuilder();
        String weekLabel = from.format(DATE_FMT) + " to " + to.format(DATE_FMT);

        ctx.append("=== ELDERLY ===\n");
        ctx.append("Name: ").append(elderly.getName()).append("\n");
        ctx.append("Week: ").append(weekLabel).append("\n\n");

        Map<HealthMetricType, List<HealthMetric>> byType = metrics.stream()
                .collect(Collectors.groupingBy(m -> m.getType(), LinkedHashMap::new, Collectors.toList()));

        ctx.append("=== HEALTH METRICS THIS WEEK ===\n");
        if (byType.isEmpty()) {
            ctx.append("No health data recorded this week.\n");
        } else {
            for (var entry : byType.entrySet()) {
                List<BigDecimal> values = entry.getValue().stream()
                        .map(m -> m.getValue()).sorted().collect(Collectors.toList());
                BigDecimal avg = values.stream().reduce(BigDecimal.ZERO, (a, b) -> a.add(b))
                        .divide(BigDecimal.valueOf(values.size()), 1, RoundingMode.HALF_UP);
                String unit = entry.getValue().get(0).getUnit();
                ctx.append(formatType(entry.getKey())).append(": ")
                        .append(values.size()).append(" readings, avg ").append(avg)
                        .append(", min ").append(values.get(0))
                        .append(", max ").append(values.get(values.size() - 1));
                if (unit != null)
                    ctx.append(" ").append(unit);
                ctx.append("\n");
            }
        }

        long taken = logs.stream().filter(l -> l.getStatus() == MedicationLogStatus.TAKEN).count();
        long missed = logs.stream().filter(l -> l.getStatus() == MedicationLogStatus.MISSED).count();
        long skipped = logs.stream().filter(l -> l.getStatus() == MedicationLogStatus.SKIPPED).count();
        long total = taken + missed + skipped;

        ctx.append("\n=== MEDICATION ADHERENCE ===\n");
        if (total > 0) {
            double rate = (double) taken / (taken + missed) * 100;
            ctx.append("Total doses tracked: ").append(total).append("\n");
            ctx.append("Taken: ").append(taken).append(", Missed: ").append(missed)
                    .append(", Skipped: ").append(skipped).append("\n");
            ctx.append("Adherence rate: ").append(String.format("%.0f%%", rate)).append("\n");
        } else {
            ctx.append("No medication data this week.\n");
        }

        OffsetDateTime twoWeeksAgo = from.minusDays(7);
        Map<HealthMetricType, BigDecimal> thisWeekAvgs = byType.entrySet().stream()
                .collect(Collectors.toMap(e -> e.getKey(),
                        e -> e.getValue().stream().map(m -> m.getValue())
                                .reduce(BigDecimal.ZERO, (a, b) -> a.add(b))
                                .divide(BigDecimal.valueOf(e.getValue().size()), 1, RoundingMode.HALF_UP)));

        Map<HealthMetricType, BigDecimal> prevWeekAvgs = metrics.isEmpty() ? Map.of()
                : healthMetricRepository.findAllByElderlyIdAndDateRange(
                        metrics.get(0).getElderly().getId(), twoWeeksAgo, from)
                        .stream()
                        .collect(Collectors.groupingBy(m -> m.getType()))
                        .entrySet().stream()
                        .collect(Collectors.toMap(e -> e.getKey(),
                                e -> e.getValue().stream().map(m -> m.getValue())
                                        .reduce(BigDecimal.ZERO, (a, b) -> a.add(b))
                                        .divide(BigDecimal.valueOf(e.getValue().size()), 1, RoundingMode.HALF_UP)));

        ctx.append("\n=== WEEK-OVER-WEEK COMPARISON ===\n");
        if (!prevWeekAvgs.isEmpty()) {
            for (var entry : thisWeekAvgs.entrySet()) {
                BigDecimal prev = prevWeekAvgs.get(entry.getKey());
                if (prev == null || prev.compareTo(BigDecimal.ZERO) == 0)
                    continue;
                BigDecimal change = entry.getValue().subtract(prev)
                        .divide(prev, 2, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100));
                String direction = change.compareTo(BigDecimal.ZERO) >= 0 ? "increased" : "decreased";
                ctx.append(formatType(entry.getKey())).append(": ")
                        .append(direction).append(" ").append(change.abs()).append("%\n");
            }
        } else {
            ctx.append("Insufficient data from previous week for comparison.\n");
        }

        ctx.append("\n=== FLAGGED METRICS ===\n");
        boolean hasFlags = false;
        for (var entry : byType.entrySet()) {
            List<BigDecimal> values = entry.getValue().stream()
                    .map(m -> m.getValue()).collect(Collectors.toList());
            BigDecimal avg = values.stream().reduce(BigDecimal.ZERO, (a, b) -> a.add(b))
                    .divide(BigDecimal.valueOf(values.size()), 1, RoundingMode.HALF_UP);
            if (isOutOfRange(entry.getKey(), avg)) {
                ctx.append("⚠️ ").append(formatType(entry.getKey()))
                        .append(": avg ").append(avg).append(" is outside normal range\n");
                hasFlags = true;
            }
        }
        if (missed > taken * 0.3) {
            ctx.append("⚠️ Medication adherence below 70% — needs attention\n");
            hasFlags = true;
        }
        if (!hasFlags) {
            ctx.append("All metrics within normal ranges.\n");
        }

        ctx.append("\nGenerate the weekly summary now per the system prompt instructions.\n");
        return ctx.toString();
    }

    private boolean isOutOfRange(HealthMetricType type, BigDecimal value) {
        return switch (type) {
            case BLOOD_PRESSURE -> value.compareTo(new BigDecimal("140")) > 0
                    || value.compareTo(new BigDecimal("90")) < 0;
            case HEART_RATE -> value.compareTo(new BigDecimal("100")) > 0
                    || value.compareTo(new BigDecimal("50")) < 0;
            case BLOOD_GLUCOSE -> value.compareTo(new BigDecimal("7.0")) > 0;
            case TEMPERATURE -> value.compareTo(new BigDecimal("38.0")) > 0;
            case SPO2 -> value.compareTo(new BigDecimal("92")) < 0;
            default -> false;
        };
    }

    
    private String buildSummaryText(String name, List<HealthMetric> metrics,
            List<MedicationLog> logs,
            OffsetDateTime from, OffsetDateTime to) {
        StringBuilder sb = new StringBuilder();
        String weekLabel = from.format(DATE_FMT) + " - " + to.format(DATE_FMT);

        sb.append("📅 Week: ").append(weekLabel).append("\n");
        sb.append("👤 ").append(name).append("\n\n");

        Map<HealthMetricType, List<HealthMetric>> byType = metrics.stream()
                .collect(Collectors.groupingBy(m -> m.getType(), LinkedHashMap::new, Collectors.toList()));

        if (!byType.isEmpty()) {
            sb.append("💓 Health Metrics:\n");
            for (var entry : byType.entrySet()) {
                String label = formatType(entry.getKey());
                List<BigDecimal> values = entry.getValue().stream()
                        .map(m -> m.getValue())
                        .sorted()
                        .collect(Collectors.toList());

                BigDecimal avg = values.stream()
                        .reduce(BigDecimal.ZERO, (a, b) -> a.add(b))
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

        long taken = logs.stream().filter(l -> l.getStatus() == MedicationLogStatus.TAKEN).count();
        long missed = logs.stream().filter(l -> l.getStatus() == MedicationLogStatus.MISSED).count();
        long total = taken + missed;
        long skipped = logs.stream().filter(l -> l.getStatus() == MedicationLogStatus.SKIPPED).count();

        if (total > 0) {
            double rate = (double) taken / total * 100;
            sb.append("💊 Medication Adherence:\n");
            sb.append("  • Taken: ").append(taken).append(" times\n");
            if (missed > 0)
                sb.append("  • Missed: ").append(missed).append(" times\n");
            if (skipped > 0)
                sb.append("  • Skipped: ").append(skipped).append(" times\n");
            sb.append("  • Rate: ").append(String.format("%.0f%%", rate));
            if (rate >= 90)
                sb.append(" ✅ Excellent!");
            else if (rate >= 70)
                sb.append(" ⚠️ Needs attention");
            else
                sb.append(" 🔴 Needs immediate improvement");
            sb.append("\n\n");
        }

        OffsetDateTime twoWeeksAgo = from.minusDays(7);
        List<HealthMetric> prevMetrics = healthMetricRepository
                .findAllByElderlyIdAndDateRange(
                        metrics.isEmpty() ? 0L : metrics.get(0).getElderly().getId(),
                        twoWeeksAgo, from);

        Map<HealthMetricType, BigDecimal> thisWeekAvgs = byType.entrySet().stream()
                .collect(Collectors.toMap(e -> e.getKey(),
                        e -> e.getValue().stream().map(m -> m.getValue())
                                .reduce(BigDecimal.ZERO, (a, b) -> a.add(b))
                                .divide(BigDecimal.valueOf(e.getValue().size()), 1, RoundingMode.HALF_UP)));

        Map<HealthMetricType, BigDecimal> prevWeekAvgs = prevMetrics.stream()
                .collect(Collectors.groupingBy(m -> m.getType()))
                .entrySet().stream()
                .collect(Collectors.toMap(e -> e.getKey(),
                        e -> e.getValue().stream().map(m -> m.getValue())
                                .reduce(BigDecimal.ZERO, (a, b) -> a.add(b))
                                .divide(BigDecimal.valueOf(e.getValue().size()), 1, RoundingMode.HALF_UP)));

        if (!prevWeekAvgs.isEmpty()) {
            sb.append("📈 vs. Previous Week:\n");
            for (var entry : thisWeekAvgs.entrySet()) {
                BigDecimal prev = prevWeekAvgs.get(entry.getKey());
                if (prev == null || prev.compareTo(BigDecimal.ZERO) == 0)
                    continue;
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
