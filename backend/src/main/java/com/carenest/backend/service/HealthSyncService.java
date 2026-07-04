package com.carenest.backend.service;

import com.carenest.backend.dto.health.HealthDataSyncRequest;
import com.carenest.backend.dto.health.HealthDataSyncResponse;
import com.carenest.backend.entity.HealthMetric;
import com.carenest.backend.entity.HealthMetricType;
import com.carenest.backend.entity.User;
import com.carenest.backend.exception.NotFoundException;
import com.carenest.backend.repository.HealthMetricRepository;
import com.carenest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class HealthSyncService {

    private final HealthMetricRepository healthMetricRepository;
    private final UserRepository userRepository;
    private final HealthMetricThresholdService thresholdService;

    public HealthDataSyncResponse sync(Long elderlyId, HealthDataSyncRequest request) {
        User elderly = userRepository.findById(elderlyId)
            .orElseThrow(() -> new NotFoundException("User không tồn tại: " + elderlyId));

        int imported = 0;
        int skipped = 0;
        List<String> alertMessages = new ArrayList<>();

        for (HealthDataSyncRequest.ExternalDataPoint point : request.getDataPoints()) {
            HealthMetricType type = resolveType(point.getType());
            if (type == null) {
                log.debug("Skipping unknown metric type: {} for elderlyId={}", point.getType(), elderlyId);
                skipped++;
                continue;
            }

            HealthMetric metric = HealthMetric.builder()
                .elderly(elderly)
                .type(type)
                .value(point.getValue())
                .valueSecondary(point.getValueSecondary())
                .unit(resolveUnit(point.getUnit(), type))
                .recordedAt(point.getRecordedAt())
                .notes(buildNotes(point.getNotes(), request.getSource()))
                .build();

            healthMetricRepository.save(metric);
            imported++;

            // Check thresholds + trigger alerts if needed
            try {
                thresholdService.checkAndAlert(metric);
            } catch (Exception e) {
                log.warn("Threshold check failed for metric id={}: {}", metric.getId(), e.getMessage());
            }
        }

        log.info("Health sync: elderlyId={} source={} imported={} skipped={}",
            elderlyId, request.getSource(), imported, skipped);

        return HealthDataSyncResponse.builder()
            .imported(imported)
            .skipped(skipped)
            .alertsTriggered(alertMessages.size())
            .alertMessages(alertMessages)
            .build();
    }

    /**
     * Maps external data type strings to our internal HealthMetricType enum.
     * Supports Google Fit, Health Connect, and Apple Health naming conventions.
     */
    private HealthMetricType resolveType(String typeStr) {
        if (typeStr == null) return null;

        String t = typeStr.toUpperCase().replace(".", "_").replace(" ", "_");

        // Direct match
        try {
            return HealthMetricType.valueOf(t);
        } catch (IllegalArgumentException ignored) {
            // fall through to fuzzy matching
        }

        // Google Fit / Health Connect data type mapping
        if (t.contains("HEART_RATE") || t.contains("HEARTRATE") || t.equals("HEART_RATE_BPM"))
            return HealthMetricType.HEART_RATE;
        if (t.contains("BLOOD_PRESSURE") || t.contains("BLOODPRESSURE"))
            return HealthMetricType.BLOOD_PRESSURE;
        if (t.contains("BLOOD_GLUCOSE") || t.contains("BLOOD_SUGAR") || t.contains("GLUCOSE"))
            return HealthMetricType.BLOOD_GLUCOSE;
        if (t.contains("WEIGHT") || t.contains("BODY_MASS"))
            return HealthMetricType.WEIGHT;
        if (t.contains("TEMPERATURE") || t.contains("BODY_TEMP"))
            return HealthMetricType.TEMPERATURE;
        if (t.contains("OXYGEN") || t.contains("SPO2") || t.contains("SATURATION"))
            return HealthMetricType.SPO2;

        return null;
    }

    private String resolveUnit(String providedUnit, HealthMetricType type) {
        if (providedUnit != null && !providedUnit.isBlank()) return providedUnit;
        return switch (type) {
            case HEART_RATE -> "bpm";
            case BLOOD_PRESSURE -> "mmHg";
            case BLOOD_GLUCOSE -> "mmol/L";
            case WEIGHT -> "kg";
            case TEMPERATURE -> "°C";
            case SPO2 -> "%";
        };
    }

    private String buildNotes(String pointNotes, String source) {
        if (source != null && !source.isBlank()) {
            String prefix = source.toUpperCase().replace("_", " ");
            return pointNotes != null
                ? "[" + prefix + "] " + pointNotes
                : "Synced from " + prefix;
        }
        return pointNotes;
    }
}
