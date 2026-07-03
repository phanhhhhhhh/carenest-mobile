package com.carenest.backend.service;

import com.carenest.backend.dto.health.HealthMetricRequest;
import com.carenest.backend.dto.health.HealthMetricResponse;
import com.carenest.backend.entity.HealthMetric;
import com.carenest.backend.entity.HealthMetricType;
import com.carenest.backend.entity.User;
import com.carenest.backend.entity.UserRole;
import com.carenest.backend.exception.NotFoundException;
import com.carenest.backend.repository.HealthMetricRepository;
import com.carenest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class HealthMetricService {

    private final HealthMetricRepository healthMetricRepository;
    private final UserRepository userRepository;
    private final HealthMetricThresholdService thresholdService;

    public HealthMetricResponse create(HealthMetricRequest request) {
        User elderly = userRepository.findById(request.getElderlyId())
            .orElseThrow(() -> new NotFoundException("User (elderly) không tồn tại: " + request.getElderlyId()));

        if (elderly.getRole() != UserRole.ELDERLY) {
            throw new IllegalArgumentException("elderlyId phải là user có role ELDERLY");
        }

        HealthMetric metric = HealthMetric.builder()
            .elderly(elderly)
            .type(request.getType())
            .value(request.getValue())
            .valueSecondary(request.getValueSecondary())
            .unit(request.getUnit())
            .recordedAt(request.getRecordedAt())
            .notes(request.getNotes())
            .build();

        HealthMetric saved = healthMetricRepository.save(metric);

        // Check thresholds and create alert if exceeded
        thresholdService.checkAndAlert(saved);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public HealthMetricResponse getById(Long id) {
        HealthMetric metric = healthMetricRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new NotFoundException("HealthMetric không tồn tại: " + id));
        return toResponse(metric);
    }

    @Transactional(readOnly = true)
    public List<HealthMetricResponse> getByElderlyId(Long elderlyId) {
        return healthMetricRepository.findByElderlyIdAndDeletedAtIsNullOrderByRecordedAtDesc(elderlyId)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<HealthMetricResponse> getByElderlyIdAndTypeAndDateRange(
        Long elderlyId, HealthMetricType type, OffsetDateTime from, OffsetDateTime to
    ) {
        return healthMetricRepository.findByElderlyIdAndTypeAndRecordedAtBetweenAndDeletedAtIsNullOrderByRecordedAtDesc(
            elderlyId, type, from, to
        ).stream().map(this::toResponse).collect(Collectors.toList());
    }

    public HealthMetricResponse update(Long id, HealthMetricRequest request) {
        HealthMetric metric = healthMetricRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new NotFoundException("HealthMetric không tồn tại: " + id));

        metric.setType(request.getType());
        metric.setValue(request.getValue());
        metric.setValueSecondary(request.getValueSecondary());
        metric.setUnit(request.getUnit());
        metric.setRecordedAt(request.getRecordedAt());
        metric.setNotes(request.getNotes());

        return toResponse(healthMetricRepository.save(metric));
    }

    public void delete(Long id) {
        HealthMetric metric = healthMetricRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new NotFoundException("HealthMetric không tồn tại: " + id));
        metric.setDeletedAt(OffsetDateTime.now());
        healthMetricRepository.save(metric);
    }

    private HealthMetricResponse toResponse(HealthMetric hm) {
        return HealthMetricResponse.builder()
            .id(hm.getId())
            .elderlyId(hm.getElderly().getId())
            .elderlyName(hm.getElderly().getName())
            .type(hm.getType())
            .value(hm.getValue())
            .valueSecondary(hm.getValueSecondary())
            .unit(hm.getUnit())
            .recordedAt(hm.getRecordedAt())
            .notes(hm.getNotes())
            .createdAt(hm.getCreatedAt())
            .updatedAt(hm.getUpdatedAt())
            .build();
    }
}