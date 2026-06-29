package com.carenest.backend.repository;

import com.carenest.backend.entity.HealthMetric;
import com.carenest.backend.entity.HealthMetricType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface HealthMetricRepository extends JpaRepository<HealthMetric, Long> {

    List<HealthMetric> findByElderlyIdAndTypeAndRecordedAtBetweenAndDeletedAtIsNullOrderByRecordedAtDesc(
        Long elderlyId, HealthMetricType type, OffsetDateTime from, OffsetDateTime to);

    @Query("SELECT hm FROM HealthMetric hm WHERE hm.elderly.id = :elderlyId AND hm.type = :type AND hm.deletedAt IS NULL ORDER BY hm.recordedAt DESC LIMIT 1")
    Optional<HealthMetric> findLatestByElderlyIdAndType(@Param("elderlyId") Long elderlyId, @Param("type") HealthMetricType type);

    @Query("SELECT hm FROM HealthMetric hm WHERE hm.elderly.id = :elderlyId AND hm.recordedAt BETWEEN :from AND :to AND hm.deletedAt IS NULL ORDER BY hm.recordedAt DESC")
    List<HealthMetric> findAllByElderlyIdAndDateRange(@Param("elderlyId") Long elderlyId, @Param("from") OffsetDateTime from, @Param("to") OffsetDateTime to);

    Optional<HealthMetric> findByIdAndDeletedAtIsNull(Long id);

    List<HealthMetric> findByElderlyIdAndDeletedAtIsNullOrderByRecordedAtDesc(Long elderlyId);
}