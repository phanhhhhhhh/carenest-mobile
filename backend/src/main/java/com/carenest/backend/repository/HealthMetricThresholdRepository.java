package com.carenest.backend.repository;

import com.carenest.backend.entity.HealthMetricThreshold;
import com.carenest.backend.entity.HealthMetricType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HealthMetricThresholdRepository extends JpaRepository<HealthMetricThreshold, Long> {
    List<HealthMetricThreshold> findByElderlyId(Long elderlyId);
    Optional<HealthMetricThreshold> findByElderlyIdAndMetricType(Long elderlyId, HealthMetricType metricType);
}
