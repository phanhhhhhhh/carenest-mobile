package com.carenest.backend.service;

import com.carenest.backend.dto.health.HealthMetricThresholdRequest;
import com.carenest.backend.dto.health.HealthMetricThresholdResponse;
import com.carenest.backend.entity.FamilyLinkStatus;
import com.carenest.backend.entity.HealthMetric;
import com.carenest.backend.entity.HealthMetricThreshold;
import com.carenest.backend.entity.Notification;
import com.carenest.backend.entity.NotificationType;
import com.carenest.backend.entity.User;
import com.carenest.backend.exception.NotFoundException;
import com.carenest.backend.repository.FamilyLinkRepository;
import com.carenest.backend.repository.HealthMetricThresholdRepository;
import com.carenest.backend.repository.NotificationRepository;
import com.carenest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
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
    private final FcmService fcmService;

    public HealthMetricThresholdResponse create(Long elderlyId, HealthMetricThresholdRequest request) {
        User elderly = userRepository.findById(elderlyId)
            .orElseThrow(() -> new NotFoundException("User (elderly) not found: " + elderlyId));

        // Check if threshold already exists for this type
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

    /**
     * Check a health metric against thresholds and create notification if breached.
     * Called from HealthMetricService after creating a new metric.
     */
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
                        .data(java.util.Map.of(
                            "metricId", metric.getId(),
                            "elderlyId", metric.getElderly().getId(),
                            "metricType", metric.getType().name(),
                            "value", metric.getValue(),
                            "thresholdId", threshold.getId()
                        ))
                        .build();
                    notificationRepository.save(notification);

                    // Send push to the elderly user
                    fcmService.sendToUser(metric.getElderly().getId(),
                        "Health Alert: " + metric.getType(),
                        body,
                        Map.of(
                            "type", "HEALTH_ALERT",
                            "metricId", metric.getId().toString(),
                            "elderlyId", metric.getElderly().getId().toString()
                        ));

                    // Send push to linked family members if alertFamily is enabled
                    if (Boolean.TRUE.equals(threshold.getAlertFamily())) {
                        List<Long> familyUserIds = familyLinkRepository
                            .findAllFamilyByElderlyIdAndStatus(
                                metric.getElderly().getId(), FamilyLinkStatus.ACTIVE)
                            .stream()
                            .map(fl -> fl.getFamily().getId())
                            .collect(Collectors.toList());

                        if (!familyUserIds.isEmpty()) {
                            fcmService.sendToUsers(familyUserIds,
                                "Health Alert: " + metric.getElderly().getName(),
                                metric.getElderly().getName() + " - " + body,
                                Map.of(
                                    "type", "HEALTH_ALERT",
                                    "metricId", metric.getId().toString(),
                                    "elderlyId", metric.getElderly().getId().toString()
                                ));
                        }
                    }

                    log.info("Health alert created for elderly={} metricType={} value={}",
                        metric.getElderly().getId(), metric.getType(), metric.getValue());
                }
            });
    }

    private boolean isValueOutOfRange(BigDecimal value, BigDecimal min, BigDecimal max) {
        if (value == null) return false;
        if (min != null && value.compareTo(min) < 0) return true;
        if (max != null && value.compareTo(max) > 0) return true;
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
            if (primaryBreached) sb.append("; ");
            sb.append("secondary value: ").append(metric.getValueSecondary());
        }

        return sb.toString();
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
