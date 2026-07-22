package com.carenest.backend.service;

import com.carenest.backend.dto.health.HealthMetricThresholdRequest;
import com.carenest.backend.entity.ElderlyProfile;
import com.carenest.backend.entity.FamilyLinkStatus;
import com.carenest.backend.entity.HealthMetric;
import com.carenest.backend.entity.HealthMetricThreshold;
import com.carenest.backend.entity.Notification;
import com.carenest.backend.entity.NotificationType;
import com.carenest.backend.entity.User;
import com.carenest.backend.dto.health.HealthMetricThresholdResponse;
import com.carenest.backend.exception.NotFoundException;
import com.carenest.backend.repository.ElderlyProfileRepository;
import com.carenest.backend.repository.FamilyLinkRepository;
import com.carenest.backend.repository.HealthMetricThresholdRepository;
import com.carenest.backend.repository.NotificationRepository;
import com.carenest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class HealthMetricThresholdService {

    private final HealthMetricThresholdRepository thresholdRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final FamilyLinkRepository familyLinkRepository;
    private final ElderlyProfileRepository elderlyProfileRepository;
    private final FcmService fcmService;
    private final GeminiApiService geminiApiService;
    private final NotificationService notificationService;

    public HealthMetricThresholdResponse create(Long elderlyId, HealthMetricThresholdRequest request) {
        User elderly = userRepository.findById(elderlyId)
                .orElseThrow(() -> new NotFoundException("User (elderly) not found: " + elderlyId));

        thresholdRepository.findByElderlyIdAndMetricType(elderlyId, request.getMetricType())
                .ifPresent(existing -> {
                    throw new IllegalArgumentException(
                            "Threshold already exists for metricType=" + request.getMetricType() +
                                    " for elderlyId=" + elderlyId);
                });

        HealthMetricThreshold threshold = HealthMetricThreshold.builder()
                .elderly(elderly)
                .metricType(request.getMetricType())
                .minValue(request.getMinValue())
                .maxValue(request.getMaxValue())
                .minValueSecondary(request.getMinValueSecondary())
                .maxValueSecondary(request.getMaxValueSecondary())
                .alertFamily(request.getAlertFamily())
                .build();

        return toResponse(thresholdRepository.save(threshold));
    }

    @Transactional(readOnly = true)
    public List<HealthMetricThresholdResponse> getByElderlyId(Long elderlyId) {
        return thresholdRepository.findByElderlyId(elderlyId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public HealthMetricThresholdResponse update(Long id, HealthMetricThresholdRequest request) {
        HealthMetricThreshold threshold = findOrThrow(id);

        threshold.setMinValue(request.getMinValue());
        threshold.setMaxValue(request.getMaxValue());
        threshold.setMinValueSecondary(request.getMinValueSecondary());
        threshold.setMaxValueSecondary(request.getMaxValueSecondary());
        if (request.getAlertFamily() != null) {
            threshold.setAlertFamily(request.getAlertFamily());
        }

        return toResponse(thresholdRepository.save(threshold));
    }

    public void delete(Long id) {
        HealthMetricThreshold threshold = findOrThrow(id);
        thresholdRepository.delete(threshold);
    }

    
    public void checkAndAlert(HealthMetric metric) {
        thresholdRepository.findByElderlyIdAndMetricType(
                metric.getElderly().getId(), metric.getType())
                .ifPresent(threshold -> {
                    boolean breached = isValueOutOfRange(metric.getValue(),
                            threshold.getMinValue(), threshold.getMaxValue());

                    boolean secondaryBreached = metric.getValueSecondary() != null
                            && isValueOutOfRange(metric.getValueSecondary(),
                                    threshold.getMinValueSecondary(), threshold.getMaxValueSecondary());

                    if (breached || secondaryBreached) {
                        String body = buildAlertBody(metric, threshold, breached, secondaryBreached);

                        Notification notification = Notification.builder()
                                .user(metric.getElderly())
                                .type(NotificationType.HEALTH_ALERT)
                                .title("Health Alert: " + metric.getType())
                                .body(body)
                                .data(Map.of(
                                        "metricId", metric.getId(),
                                        "elderlyId", metric.getElderly().getId(),
                                        "metricType", metric.getType().name(),
                                        "value", metric.getValue(),
                                        "thresholdId", threshold.getId()))
                                .build();
                        notificationRepository.save(notification);

                        fcmService.sendToUser(metric.getElderly().getId(),
                                "Health Alert: " + metric.getType(),
                                body,
                                Map.of(
                                        "type", "HEALTH_ALERT",
                                        "metricId", metric.getId().toString(),
                                        "elderlyId", metric.getElderly().getId().toString()));

                        if (Boolean.TRUE.equals(threshold.getAlertFamily())) {
                            List<Long> familyUserIds = familyLinkRepository
                                    .findAllFamilyByElderlyIdAndStatus(
                                            metric.getElderly().getId(), FamilyLinkStatus.ACTIVE)
                                    .stream()
                                    .map(fl -> fl.getFamily().getId())
                                    .collect(Collectors.toList());

                            if (!familyUserIds.isEmpty()) {
                                String familyTitle = "Health Alert: " + metric.getElderly().getName();
                                String familyBody = metric.getElderly().getName() + " - " + body;
                                fcmService.sendToUsers(familyUserIds, familyTitle, familyBody,
                                        Map.of(
                                                "type", "HEALTH_ALERT",
                                                "metricId", metric.getId().toString(),
                                                "elderlyId", metric.getElderly().getId().toString()));
                                notificationService.createForUsers(familyUserIds, NotificationType.HEALTH_ALERT,
                                        familyTitle, familyBody,
                                        Map.of(
                                                "metricId", metric.getId(),
                                                "elderlyId", metric.getElderly().getId(),
                                                "metricType", metric.getType().name(),
                                                "value", metric.getValue(),
                                                "thresholdId", threshold.getId()));
                            }
                        }

                        log.info("Health alert created for elderly={} metricType={} value={}",
                                metric.getElderly().getId(), metric.getType(), metric.getValue());
                    }
                });
    }

    private boolean isValueOutOfRange(BigDecimal value, BigDecimal min, BigDecimal max) {
        if (value == null)
            return false;
        if (min != null && value.compareTo(min) < 0)
            return true;
        if (max != null && value.compareTo(max) > 0)
            return true;
        return false;
    }

    private String buildAlertBody(HealthMetric metric, HealthMetricThreshold threshold,
            boolean primaryBreached, boolean secondaryBreached) {
        StringBuilder sb = new StringBuilder();
        sb.append("Metric out of range: ").append(metric.getType()).append(" out of range: ");

        if (primaryBreached) {
            sb.append(metric.getValue()).append(" ").append(metric.getUnit());
            if (threshold.getMinValue() != null && threshold.getMaxValue() != null) {
                sb.append(" (threshold: ").append(threshold.getMinValue())
                        .append(" - ").append(threshold.getMaxValue()).append(")");
            }
        }

        if (secondaryBreached && metric.getValueSecondary() != null) {
            if (primaryBreached)
                sb.append("; ");
            sb.append("secondary value: ").append(metric.getValueSecondary());
        }

        return sb.toString();
    }

    
    public Map<String, Object> recommendThresholds(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        Optional<ElderlyProfile> profileOpt = elderlyProfileRepository.findByUserIdAndDeletedAtIsNull(userId);

        if (!geminiApiService.isAvailable()) {
            return Map.of("aiRecommended", false, "recommendations",
                    List.of(
                            Map.of("metricType", "BLOOD_PRESSURE", "minValue", 90, "maxValue", 140, "unit", "mmHg"),
                            Map.of("metricType", "HEART_RATE", "minValue", 60, "maxValue", 100, "unit", "bpm"),
                            Map.of("metricType", "BLOOD_GLUCOSE", "minValue", 3.9, "maxValue", 7.0, "unit", "mmol/L"),
                            Map.of("metricType", "TEMPERATURE", "minValue", 36.1, "maxValue", 37.5, "unit", "C"),
                            Map.of("metricType", "SPO2", "minValue", 95, "maxValue", 100, "unit", "%")));
        }

        try {
            String context = "Patient: " + user.getName() + "\n"
                    + (profileOpt.isPresent()
                            ? "Conditions: " + String.join(", ", profileOpt.get().getHealthConditions())
                            : "No chronic conditions recorded.");

            String aiResponse = geminiApiService.generateHealthAnalysis(
                    "Recommend personalized health thresholds for this elderly patient. "
                            + "Consider their chronic conditions. Output thresholds for: "
                            + "BLOOD_PRESSURE, HEART_RATE, BLOOD_GLUCOSE, TEMPERATURE, SPO2.",
                    context);
            return Map.of("aiRecommended", true, "recommendations", aiResponse);
        } catch (Exception e) {
            log.warn("Gemini threshold recommendation failed: {}", e.getMessage());
            return Map.of("aiRecommended", false, "error", "AI service unavailable");
        }
    }

    private HealthMetricThreshold findOrThrow(Long id) {
        return thresholdRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("HealthMetricThreshold not found: " + id));
    }

    private HealthMetricThresholdResponse toResponse(HealthMetricThreshold t) {
        return HealthMetricThresholdResponse.builder()
                .id(t.getId())
                .elderlyId(t.getElderly().getId())
                .metricType(t.getMetricType())
                .minValue(t.getMinValue())
                .maxValue(t.getMaxValue())
                .minValueSecondary(t.getMinValueSecondary())
                .maxValueSecondary(t.getMaxValueSecondary())
                .alertFamily(t.getAlertFamily())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }
}
