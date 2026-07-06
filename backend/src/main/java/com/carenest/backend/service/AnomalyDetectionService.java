package com.carenest.backend.service;

import com.carenest.backend.entity.*;
import com.carenest.backend.repository.*;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Hybrid anomaly detection: statistical triage + Gemini AI deep analysis.
 * <p>
 * UC-11: AI Anomaly Detection — automatically detect and alert when health
 * metrics exceed personalized thresholds. Uses the elderly's health profile
 * (UC-23) for context-aware analysis.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnomalyDetectionService {

    // Statistical thresholds (fast triage)
    private static final double ZSCORE_THRESHOLD = 2.5;
    private static final double IQR_MULTIPLIER = 1.5;
    private static final double MOVING_AVG_DEVIATION_PCT = 20.0;
    private static final int RECENT_WINDOW = 30;
    private static final int MA_WINDOW = 7;
    private static final int MIN_DATA_POINTS = 5;

    private final HealthMetricRepository healthMetricRepository;
    private final NotificationRepository notificationRepository;
    private final FamilyLinkRepository familyLinkRepository;
    private final ElderlyProfileRepository elderlyProfileRepository;
    private final FcmService fcmService;
    private final GeminiApiService geminiApiService;

    /**
     * Analyze a newly recorded metric for anomalies.
     * Phase 1: Statistical triage (fast, always runs)
     * Phase 2: Gemini AI deep analysis (async, when statistical anomaly detected or always on)
     */
    public AnomalyResult analyze(HealthMetric metric) {
        List<HealthMetric> recentMetrics = fetchRecentMetrics(metric);

        // Exclude the current metric from historical analysis
        recentMetrics = recentMetrics.stream()
            .filter(m -> !m.getId().equals(metric.getId()))
            .collect(Collectors.toList());

        if (recentMetrics.size() < MIN_DATA_POINTS) {
            return AnomalyResult.builder()
                .isAnomaly(false)
                .reasons(List.of())
                .confidence(0)
                .aiAnalysis("Insufficient data — need at least " + MIN_DATA_POINTS + " readings for analysis.")
                .build();
        }

        // Phase 1: Statistical triage
        List<String> reasons = new ArrayList<>();
        int anomalyCount = 0;

        if (checkZScore(metric, recentMetrics)) {
            reasons.add("Value deviates " + ZSCORE_THRESHOLD + "+ standard deviations from mean");
            anomalyCount++;
        }
        if (checkIQR(metric, recentMetrics)) {
            reasons.add("Value outside interquartile range (IQR × " + IQR_MULTIPLIER + ")");
            anomalyCount++;
        }
        if (checkMovingAverage(metric, recentMetrics)) {
            reasons.add("Deviation >" + (int) MOVING_AVG_DEVIATION_PCT + "% from " + MA_WINDOW + "-day moving average");
            anomalyCount++;
        }

        boolean isAnomaly = anomalyCount >= 2;
        int confidence = Math.min(anomalyCount * 33, 100);

        if (isAnomaly) {
            log.warn("Statistical anomaly: elderlyId={} type={} value={} reasons={}",
                metric.getElderly().getId(), metric.getType(), metric.getValue(), reasons);
            // Create basic alert immediately (fast path)
            createAnomalyAlert(metric, reasons, null);
            // Trigger AI deep analysis asynchronously
            runAiDeepAnalysis(metric, recentMetrics, reasons);
        }

        return AnomalyResult.builder()
            .isAnomaly(isAnomaly)
            .reasons(reasons)
            .confidence(confidence)
            .build();
    }

    /**
     * Run Gemini AI deep analysis for a metric.
     * Called by HealthCheckScheduler for periodic batch analysis.
     */
    @Async
    public void runAiDeepAnalysis(HealthMetric metric, List<HealthMetric> recentMetrics, List<String> statisticalReasons) {
        if (!geminiApiService.isAvailable()) {
            log.debug("Gemini API not available — skipping AI deep analysis");
            return;
        }

        try {
            String systemPrompt = buildAiSystemPrompt(metric);
            String dataContext = buildAiDataContext(metric, recentMetrics, statisticalReasons);
            String aiAnalysis = geminiApiService.generateHealthAnalysis(systemPrompt, dataContext);

            // Update the alert notification with AI insight
            appendAiInsight(metric, aiAnalysis);

            log.info("Gemini AI analysis complete for elderlyId={} type={}: {} chars",
                metric.getElderly().getId(), metric.getType(),
                aiAnalysis != null ? aiAnalysis.length() : 0);
        } catch (Exception e) {
            log.error("Gemini AI analysis failed for elderlyId={}: {}",
                metric.getElderly().getId(), e.getMessage());
        }
    }

    /**
     * Batch AI analysis for all elderly (called by HealthCheckScheduler).
     */
    public void runBatchAiAnalysis() {
        if (!geminiApiService.isAvailable()) {
            log.debug("Gemini API not available — skipping batch AI analysis");
            return;
        }
        log.info("Starting batch AI health analysis...");
        // This is called from scheduler — individual metric analysis is
        // triggered when each metric is created via HealthMetricService
        log.info("AI analysis is event-driven on metric creation");
    }

    // ── Statistical Checks (kept for fast triage) ─────────────────────────────

    private List<HealthMetric> fetchRecentMetrics(HealthMetric metric) {
        return healthMetricRepository
            .findByElderlyIdAndTypeAndRecordedAtBetweenAndDeletedAtIsNullOrderByRecordedAtDesc(
                metric.getElderly().getId(),
                metric.getType(),
                OffsetDateTime.now().minusDays(RECENT_WINDOW),
                OffsetDateTime.now());
    }

    private boolean checkZScore(HealthMetric metric, List<HealthMetric> history) {
        List<BigDecimal> values = history.stream().map(HealthMetric::getValue).collect(Collectors.toList());
        BigDecimal mean = mean(values);
        BigDecimal stdDev = stdDev(values, mean);
        if (stdDev.compareTo(BigDecimal.ZERO) == 0) return false;
        BigDecimal zScore = metric.getValue().subtract(mean).abs()
            .divide(stdDev, 4, RoundingMode.HALF_UP);
        return zScore.compareTo(BigDecimal.valueOf(ZSCORE_THRESHOLD)) > 0;
    }

    private boolean checkIQR(HealthMetric metric, List<HealthMetric> history) {
        List<BigDecimal> sorted = history.stream().map(HealthMetric::getValue).sorted().collect(Collectors.toList());
        int n = sorted.size();
        BigDecimal q1 = sorted.get((int) (n * 0.25));
        BigDecimal q3 = sorted.get((int) (n * 0.75));
        BigDecimal iqr = q3.subtract(q1);
        BigDecimal lower = q1.subtract(iqr.multiply(BigDecimal.valueOf(IQR_MULTIPLIER)));
        BigDecimal upper = q3.add(iqr.multiply(BigDecimal.valueOf(IQR_MULTIPLIER)));
        return metric.getValue().compareTo(lower) < 0 || metric.getValue().compareTo(upper) > 0;
    }

    private boolean checkMovingAverage(HealthMetric metric, List<HealthMetric> history) {
        List<HealthMetric> sorted = history.stream()
            .sorted(Comparator.comparing(HealthMetric::getRecordedAt).reversed())
            .limit(MA_WINDOW).collect(Collectors.toList());
        if (sorted.size() < MA_WINDOW) return false;
        BigDecimal ma = mean(sorted.stream().map(HealthMetric::getValue).collect(Collectors.toList()));
        if (ma.compareTo(BigDecimal.ZERO) == 0) return false;
        BigDecimal deviation = metric.getValue().subtract(ma).abs()
            .divide(ma, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
        return deviation.compareTo(BigDecimal.valueOf(MOVING_AVG_DEVIATION_PCT)) > 0;
    }

    // ── Alert Creation ──────────────────────────────────────────────────────

    private void createAnomalyAlert(HealthMetric metric, List<String> reasons, String aiInsight) {
        User elderly = metric.getElderly();
        String title = "⚠️ Health Alert: " + formatType(metric.getType());
        StringBuilder body = new StringBuilder();
        body.append(elderly.getName()).append(" - ").append(formatType(metric.getType()))
            .append(": ").append(metric.getValue()).append(" ").append(metric.getUnit());
        if (!reasons.isEmpty()) {
            body.append("\n\nDetected: ").append(String.join("; ", reasons));
        }
        if (aiInsight != null && !aiInsight.isBlank()) {
            body.append("\n\n🤖 AI Analysis: ").append(aiInsight);
        }

        Notification notification = Notification.builder()
            .user(elderly)
            .type(NotificationType.HEALTH_ALERT)
            .title(title)
            .body(body.toString())
            .data(Map.of(
                "metricId", metric.getId().toString(),
                "elderlyId", elderly.getId().toString(),
                "type", metric.getType().name(),
                "value", metric.getValue().toString(),
                "anomaly", "true",
                "aiAnalysis", aiInsight != null ? aiInsight : ""
            ))
            .build();
        notificationRepository.save(notification);

        // Push to elderly + linked family
        Map<String, String> pushData = Map.of(
            "type", "HEALTH_ALERT",
            "metricId", metric.getId().toString(),
            "elderlyId", elderly.getId().toString()
        );
        fcmService.sendToUser(elderly.getId(), title, body.toString(), pushData);

        List<Long> familyIds = familyLinkRepository
            .findAllFamilyByElderlyIdAndStatus(elderly.getId(), FamilyLinkStatus.ACTIVE)
            .stream().map(fl -> fl.getFamily().getId()).collect(Collectors.toList());
        if (!familyIds.isEmpty()) {
            fcmService.sendToUsers(familyIds, title, body.toString(), pushData);
        }
    }

    /**
     * Append AI insight to the most recent alert for this metric.
     */
    private void appendAiInsight(HealthMetric metric, String aiInsight) {
        // Find the most recent HEALTH_ALERT for this elderly and update its body
        // Simplified: create a follow-up notification with the AI insight
        User elderly = metric.getElderly();
        String title = "🤖 AI Insight: " + formatType(metric.getType());
        Notification insightNote = Notification.builder()
            .user(elderly)
            .type(NotificationType.HEALTH_ALERT)
            .title(title)
            .body(aiInsight)
            .data(Map.of(
                "metricId", metric.getId().toString(),
                "type", "AI_INSIGHT",
                "aiAnalysis", aiInsight
            ))
            .build();
        notificationRepository.save(insightNote);

        // Push AI insight to family
        List<Long> familyIds = familyLinkRepository
            .findAllFamilyByElderlyIdAndStatus(elderly.getId(), FamilyLinkStatus.ACTIVE)
            .stream().map(fl -> fl.getFamily().getId()).collect(Collectors.toList());
        if (!familyIds.isEmpty()) {
            fcmService.sendToUsers(familyIds, title, aiInsight,
                Map.of("type", "AI_INSIGHT", "elderlyId", elderly.getId().toString()));
        }
    }

    // ── AI Prompt Building ──────────────────────────────────────────────────

    private String buildAiSystemPrompt(HealthMetric metric) {
        User elderly = metric.getElderly();
        StringBuilder prompt = new StringBuilder();

        prompt.append("You are a senior health analyst AI for CareNest, an elderly care platform.\n");
        prompt.append("Your task: analyze health metric data and provide a concise, actionable insight.\n\n");

        prompt.append("=== PATIENT CONTEXT ===\n");
        prompt.append("Name: ").append(elderly.getName()).append("\n");

        // Add health profile context
        var profileOpt = elderlyProfileRepository.findByUserIdAndDeletedAtIsNull(elderly.getId());
        if (profileOpt.isPresent()) {
            var profile = profileOpt.get();
            if (profile.getHealthConditions() != null && !profile.getHealthConditions().isEmpty()) {
                prompt.append("Chronic conditions: ").append(String.join(", ", profile.getHealthConditions())).append("\n");
            }
            if (profile.getAllergies() != null && !profile.getAllergies().isBlank()) {
                prompt.append("Allergies: ").append(profile.getAllergies()).append("\n");
            }
            if (profile.getBloodType() != null) {
                prompt.append("Blood type: ").append(profile.getBloodType()).append("\n");
            }
            prompt.append("Weight: ").append(profile.getWeightKg()).append(" kg, Height: ").append(profile.getHeightCm()).append(" cm\n");
        }

        prompt.append("\n=== INSTRUCTIONS ===\n");
        prompt.append("1. Analyze whether the current reading is concerning given the patient's profile.\n");
        prompt.append("2. Compare against the 7-day trend provided.\n");
        prompt.append("3. Reference normal ranges for this metric type.\n");
        prompt.append("4. Output format:\n");
        prompt.append("   - One-sentence summary (is this concerning?)\n");
        prompt.append("   - Trend analysis (1 sentence)\n");
        prompt.append("   - Recommendation (1 sentence, always include 'consult your doctor')\n");
        prompt.append("5. Use simple, clear language suitable for family members.\n");
        prompt.append("6. NEVER diagnose — always recommend professional medical consultation.\n");
        prompt.append("7. Keep total response under 250 words.\n");

        return prompt.toString();
    }

    private String buildAiDataContext(HealthMetric metric, List<HealthMetric> recentMetrics,
                                       List<String> statisticalReasons) {
        StringBuilder data = new StringBuilder();

        data.append("=== CURRENT READING ===\n");
        data.append("Metric: ").append(formatType(metric.getType())).append("\n");
        data.append("Value: ").append(metric.getValue()).append(" ").append(metric.getUnit());
        if (metric.getValueSecondary() != null) {
            data.append(" / ").append(metric.getValueSecondary());
        }
        data.append("\n");
        data.append("Recorded: ").append(metric.getRecordedAt()
            .atZoneSameInstant(ZoneId.of("Asia/Ho_Chi_Minh"))
            .format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))).append("\n\n");

        data.append("=== STATISTICAL FLAGS ===\n");
        if (statisticalReasons.isEmpty()) {
            data.append("No statistical flags triggered.\n");
        } else {
            for (String reason : statisticalReasons) {
                data.append("- ").append(reason).append("\n");
            }
        }

        data.append("\n=== 7-DAY TREND ===\n");
        List<HealthMetric> sorted = recentMetrics.stream()
            .sorted(Comparator.comparing(HealthMetric::getRecordedAt))
            .limit(MA_WINDOW * 3) // up to 21 readings for context
            .collect(Collectors.toList());
        if (sorted.isEmpty()) {
            data.append("No recent data available.\n");
        } else {
            for (HealthMetric m : sorted) {
                data.append(m.getRecordedAt()
                    .atZoneSameInstant(ZoneId.of("Asia/Ho_Chi_Minh"))
                    .format(DateTimeFormatter.ofPattern("MM/dd HH:mm")))
                    .append(": ").append(m.getValue()).append(" ").append(m.getUnit()).append("\n");
            }
        }

        data.append("\n=== NORMAL RANGES ===\n");
        data.append(getNormalRanges(metric.getType()));

        data.append("\n\nAnalyze this data and provide your insight per the instructions.\n");
        return data.toString();
    }

    private String getNormalRanges(HealthMetricType type) {
        return switch (type) {
            case BLOOD_PRESSURE -> "Normal: Systolic <120, Diastolic <80 mmHg";
            case HEART_RATE -> "Normal: 60-100 bpm at rest";
            case BLOOD_GLUCOSE -> "Normal fasting: 3.9-5.5 mmol/L (70-99 mg/dL)";
            case WEIGHT -> "Stable weight; changes >2 kg/week may be concerning";
            case TEMPERATURE -> "Normal: 36.1-37.2°C (97-99°F)";
            case SPO2 -> "Normal: 95-100%; below 92% is concerning";
        };
    }

    // ── Statistics Helpers ──────────────────────────────────────────────────

    private BigDecimal mean(List<BigDecimal> values) {
        if (values.isEmpty()) return BigDecimal.ZERO;
        return values.stream().reduce(BigDecimal.ZERO, BigDecimal::add)
            .divide(BigDecimal.valueOf(values.size()), 4, RoundingMode.HALF_UP);
    }

    private BigDecimal stdDev(List<BigDecimal> values, BigDecimal mean) {
        if (values.size() < 2) return BigDecimal.ZERO;
        BigDecimal sumSq = values.stream().map(v -> v.subtract(mean).pow(2))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        return BigDecimal.valueOf(Math.sqrt(
            sumSq.divide(BigDecimal.valueOf(values.size() - 1), 4, RoundingMode.HALF_UP).doubleValue()));
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

    // ── Result DTO ──────────────────────────────────────────────────────────

    @Getter
    @Builder
    public static class AnomalyResult {
        private boolean isAnomaly;
        private List<String> reasons;
        private int confidence;
        @Builder.Default
        private String aiAnalysis = "";
    }
}
