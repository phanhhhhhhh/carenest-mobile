package com.carenest.backend.service;

import com.carenest.backend.dto.health.HealthReportResponse;
import com.carenest.backend.dto.health.MetricDataPoint;
import com.carenest.backend.dto.health.MetricReport;
import com.carenest.backend.dto.health.MetricStats;
import com.carenest.backend.entity.HealthMetric;
import com.carenest.backend.entity.HealthMetricType;
import com.carenest.backend.entity.User;
import com.carenest.backend.exception.NotFoundException;
import com.carenest.backend.repository.HealthMetricRepository;
import com.carenest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HealthReportService {

    private final HealthMetricRepository healthMetricRepository;
    private final UserRepository userRepository;

    public HealthReportResponse generateReport(Long elderlyId, Set<HealthMetricType> types,
                                                OffsetDateTime from, OffsetDateTime to) {
        User elderly = userRepository.findById(elderlyId)
            .orElseThrow(() -> new NotFoundException("User not found: " + elderlyId));

        if (from == null) from = OffsetDateTime.now().minusWeeks(1);
        if (to == null) to = OffsetDateTime.now();
        final Set<HealthMetricType> resolvedTypes = (types == null || types.isEmpty())
            ? Set.of(HealthMetricType.values())
            : types;

        List<HealthMetric> allMetrics = healthMetricRepository
            .findAllByElderlyIdAndDateRange(elderlyId, from, to);

        // Group by type
        Map<HealthMetricType, List<HealthMetric>> grouped = allMetrics.stream()
            .filter(m -> resolvedTypes.contains(m.getType()))
            .collect(Collectors.groupingBy(m -> m.getType()));

        List<MetricReport> reports = new ArrayList<>();
        for (HealthMetricType type : resolvedTypes) {
            List<HealthMetric> typeMetrics = grouped.getOrDefault(type, List.of());
            if (typeMetrics.isEmpty()) continue;

            // Sort by recordedAt ascending for time-series
            typeMetrics.sort(Comparator.comparing(m -> m.getRecordedAt()));

            List<MetricDataPoint> dataPoints = typeMetrics.stream()
                .map(m -> MetricDataPoint.builder()
                    .recordedAt(m.getRecordedAt())
                    .value(m.getValue())
                    .valueSecondary(m.getValueSecondary())
                    .notes(m.getNotes())
                    .build())
                .collect(Collectors.toList());

            MetricStats stats = computeStats(typeMetrics);

            reports.add(MetricReport.builder()
                .type(type.name())
                .unit(typeMetrics.get(0).getUnit())
                .dataPoints(dataPoints)
                .stats(stats)
                .build());
        }

        return HealthReportResponse.builder()
            .elderlyId(elderlyId)
            .elderlyName(elderly.getName())
            .from(from)
            .to(to)
            .reports(reports)
            .build();
    }

    private MetricStats computeStats(List<HealthMetric> metrics) {
        int count = metrics.size();

        if (count == 0) {
            return MetricStats.builder()
                .count(0)
                .trend("INSUFFICIENT_DATA")
                .build();
        }

        // Primary value stats
        BigDecimal sumValue = BigDecimal.ZERO;
        BigDecimal minValue = null;
        BigDecimal maxValue = null;

        // Secondary value stats (for BP diastolic, etc.)
        BigDecimal sumSecondary = BigDecimal.ZERO;
        BigDecimal minSecondary = null;
        BigDecimal maxSecondary = null;
        int secondaryCount = 0;

        for (HealthMetric m : metrics) {
            sumValue = sumValue.add(m.getValue());
            if (minValue == null || m.getValue().compareTo(minValue) < 0) minValue = m.getValue();
            if (maxValue == null || m.getValue().compareTo(maxValue) > 0) maxValue = m.getValue();

            if (m.getValueSecondary() != null) {
                sumSecondary = sumSecondary.add(m.getValueSecondary());
                if (minSecondary == null || m.getValueSecondary().compareTo(minSecondary) < 0)
                    minSecondary = m.getValueSecondary();
                if (maxSecondary == null || m.getValueSecondary().compareTo(maxSecondary) > 0)
                    maxSecondary = m.getValueSecondary();
                secondaryCount++;
            }
        }

        BigDecimal avgValue = sumValue.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP);
        BigDecimal avgSecondary = secondaryCount > 0
            ? sumSecondary.divide(BigDecimal.valueOf(secondaryCount), 2, RoundingMode.HALF_UP)
            : null;

        // Trend: compare first-half average vs second-half average
        String trend = computeTrend(metrics);

        return MetricStats.builder()
            .avgValue(avgValue)
            .minValue(minValue)
            .maxValue(maxValue)
            .avgSecondary(avgSecondary)
            .minSecondary(minSecondary)
            .maxSecondary(maxSecondary)
            .count(count)
            .trend(trend)
            .build();
    }

    private String computeTrend(List<HealthMetric> metrics) {
        if (metrics.size() < 2) return "INSUFFICIENT_DATA";

        int mid = metrics.size() / 2;
        List<HealthMetric> firstHalf = metrics.subList(0, mid);
        List<HealthMetric> secondHalf = metrics.subList(mid, metrics.size());

        BigDecimal firstAvg = firstHalf.stream()
            .map(m -> m.getValue())
            .reduce(BigDecimal.ZERO, (a, b) -> a.add(b))
            .divide(BigDecimal.valueOf(firstHalf.size()), 4, RoundingMode.HALF_UP);

        BigDecimal secondAvg = secondHalf.stream()
            .map(m -> m.getValue())
            .reduce(BigDecimal.ZERO, (a, b) -> a.add(b))
            .divide(BigDecimal.valueOf(secondHalf.size()), 4, RoundingMode.HALF_UP);

        if (firstAvg.compareTo(BigDecimal.ZERO) == 0) return "STABLE";

        BigDecimal change = secondAvg.subtract(firstAvg)
            .divide(firstAvg, 4, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100));

        if (change.compareTo(BigDecimal.valueOf(5)) > 0) return "INCREASING";
        if (change.compareTo(BigDecimal.valueOf(-5)) < 0) return "DECREASING";
        return "STABLE";
    }
}
