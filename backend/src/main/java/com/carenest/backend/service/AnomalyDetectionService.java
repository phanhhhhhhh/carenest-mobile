package com.carenest.backend.service;

import com.carenest.backend.entity.HealthMetric;
import com.carenest.backend.entity.HealthMetricType;
import com.carenest.backend.entity.Notification;
import com.carenest.backend.entity.NotificationType;
import com.carenest.backend.entity.User;
import com.carenest.backend.repository.FamilyLinkRepository;
import com.carenest.backend.repository.HealthMetricRepository;
import com.carenest.backend.repository.NotificationRepository;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AnomalyDetectionService {

    // Thresholds
    private static final double ZSCORE_THRESHOLD = 2.5;
    private static final double IQR_MULTIPLIER = 1.5;
    private static final double MOVING_AVG_DEVIATION_PCT = 20.0;
    private static final int RECENT_WINDOW = 30;
    private static final int MA_WINDOW = 7;
    private static final int MIN_DATA_POINTS = 5;

    private final HealthMetricRepository healthMetricRepository;
    private final NotificationRepository notificationRepository;
    private final FamilyLinkRepository familyLinkRepository;
    private final FcmService fcmService;

    /**
     * Analyze a newly recorded metric for anomalies.
     * Returns a list of anomaly reasons (empty = no anomaly detected).
     */
    public AnomalyResult analyze(HealthMetric metric) {
        List<HealthMetric> recentMetrics = healthMetricRepository
            .findByElderlyIdAndTypeAndRecordedAtBetweenAndDeletedAtIsNullOrderByRecordedAtDesc(
                metric.getElderly().getId(),
                metric.getType(),
                OffsetDateTime.now().minusDays(30),
                OffsetDateTime.now());

        // Exclude the current metric from historical analysis
        recentMetrics = recentMetrics.stream()
            .filter(m -> !m.getId().equals(metric.getId()))
            .collect(Collectors.toList());

        if (recentMetrics.size() < MIN_DATA_POINTS) {
            return AnomalyResult.builder()
                .isAnomaly(false)
                .reasons(List.of())
                .confidence(0)
                .build();
        }

        List<String> reasons = new ArrayList<>();
        int anomalyCount = 0;

        // 1. Z-Score check
        if (checkZScore(metric, recentMetrics)) {
            reasons.add("Z-Score: value deviates " + ZSCORE_THRESHOLD + "+ standard deviations");
            anomalyCount++;
        }

        // 2. IQR outlier check
        if (checkIQR(metric, recentMetrics)) {
            reasons.add("IQR: value outside interquartile range");
            anomalyCount++;
        }

        // 3. Moving average deviation
        if (checkMovingAverage(metric, recentMetrics)) {
            reasons.add("Moving Average: deviation >" + (int) MOVING_AVG_DEVIATION_PCT + "% from " + MA_WINDOW + " recent average");
            anomalyCount++;
        }

        boolean isAnomaly = anomalyCount >= 2; // Require at least 2 methods to agree

        if (isAnomaly) {
            log.warn("Anomaly detected: elderlyId={} type={} value={} reasons={}",
                metric.getElderly().getId(), metric.getType(), metric.getValue(), reasons);
            createAnomalyAlert(metric, reasons);
        }

        return AnomalyResult.builder()
            .isAnomaly(isAnomaly)
            .reasons(reasons)
            .confidence(Math.min(anomalyCount * 33, 100))
            .build();
    }

    // ── Z-Score ─────────────────────────────────────────────────────────────

    private boolean checkZScore(HealthMetric metric, List<HealthMetric> history) {
        List<BigDecimal> values = history.stream()
            .map(HealthMetric::getValue)
            .collect(Collectors.toList());

        BigDecimal mean = mean(values);
        BigDecimal stdDev = stdDev(values, mean);

        if (stdDev.compareTo(BigDecimal.ZERO) == 0) return false;

        BigDecimal zScore = metric.getValue().subtract(mean)
            .abs()
            .divide(stdDev, 4, RoundingMode.HALF_UP);

        return zScore.compareTo(BigDecimal.valueOf(ZSCORE_THRESHOLD)) > 0;
    }

    // ── IQR ─────────────────────────────────────────────────────────────────

    private boolean checkIQR(HealthMetric metric, List<HealthMetric> history) {
        List<BigDecimal> sorted = history.stream()
            .map(HealthMetric::getValue)
            .sorted()
            .collect(Collectors.toList());

        int n = sorted.size();
        BigDecimal q1 = sorted.get((int) (n * 0.25));
        BigDecimal q3 = sorted.get((int) (n * 0.75));
        BigDecimal iqr = q3.subtract(q1);

        BigDecimal lowerFence = q1.subtract(iqr.multiply(BigDecimal.valueOf(IQR_MULTIPLIER)));
        BigDecimal upperFence = q3.add(iqr.multiply(BigDecimal.valueOf(IQR_MULTIPLIER)));

        return metric.getValue().compareTo(lowerFence) < 0
            || metric.getValue().compareTo(upperFence) > 0;
    }

    // ── Moving Average ──────────────────────────────────────────────────────

    private boolean checkMovingAverage(HealthMetric metric, List<HealthMetric> history) {
        List<HealthMetric> sorted = history.stream()
            .sorted(Comparator.comparing(HealthMetric::getRecordedAt).reversed())
            .limit(MA_WINDOW)
            .collect(Collectors.toList());

        if (sorted.size() < MA_WINDOW) return false;

        BigDecimal ma = mean(sorted.stream().map(HealthMetric::getValue).collect(Collectors.toList()));
        if (ma.compareTo(BigDecimal.ZERO) == 0) return false;

        BigDecimal deviation = metric.getValue().subtract(ma)
            .abs()
            .divide(ma, 4, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100));

        return deviation.compareTo(BigDecimal.valueOf(MOVING_AVG_DEVIATION_PCT)) > 0;
    }

    // ── Alert Creation ──────────────────────────────────────────────────────

    private void createAnomalyAlert(HealthMetric metric, List<String> reasons) {
        User elderly = metric.getElderly();
        String title = "⚠️ Anomaly: " + formatType(metric.getType());
        String body = elderly.getName() + " - " + formatType(metric.getType())
            + ": " + metric.getValue() + " " + metric.getUnit()
            + ". Reason: " + String.join("; ", reasons);

        Notification notification = Notification.builder()
            .user(elderly)
            .type(NotificationType.HEALTH_ALERT)
            .title(title)
            .body(body)
            .data(Map.of(
                "metricId", metric.getId().toString(),
                "elderlyId", elderly.getId().toString(),
                "type", metric.getType().name(),
                "value", metric.getValue().toString(),
                "anomaly", "true"
            ))
            .build();
        notificationRepository.save(notification);

        // Push to elderly
        fcmService.sendToUser(elderly.getId(), title, body,
            Map.of("type", "HEALTH_ALERT", "metricId", metric.getId().toString()));

        // Push to linked family members
        List<Long> familyIds = familyLinkRepository
            .findAllFamilyByElderlyIdAndStatus(elderly.getId(),
                com.carenest.backend.entity.FamilyLinkStatus.ACTIVE)
            .stream()
            .map(fl -> fl.getFamily().getId())
            .collect(Collectors.toList());

        if (!familyIds.isEmpty()) {
            fcmService.sendToUsers(familyIds, title, body,
                Map.of("type", "HEALTH_ALERT", "elderlyId", elderly.getId().toString()));
        }
    }

    // ── Statistics Helpers ──────────────────────────────────────────────────

    private BigDecimal mean(List<BigDecimal> values) {
        if (values.isEmpty()) return BigDecimal.ZERO;
        BigDecimal sum = values.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(BigDecimal.valueOf(values.size()), 4, RoundingMode.HALF_UP);
    }

    private BigDecimal stdDev(List<BigDecimal> values, BigDecimal mean) {
        if (values.size() < 2) return BigDecimal.ZERO;
        BigDecimal sumSq = values.stream()
            .map(v -> v.subtract(mean).pow(2))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal variance = sumSq.divide(BigDecimal.valueOf(values.size() - 1), 4, RoundingMode.HALF_UP);
        return BigDecimal.valueOf(Math.sqrt(variance.doubleValue()));
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
    }
}
