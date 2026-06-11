package com.carenest.backend.repository;

import com.carenest.backend.entity.MedicationLog;
import com.carenest.backend.entity.MedicationLogStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface MedicationLogRepository extends JpaRepository<MedicationLog, Long> {

    List<MedicationLog> findByMedicationIdAndTakenAtBetweenOrderByTakenAtDesc(Long medicationId, OffsetDateTime from, OffsetDateTime to);

    // Adherence rate: count by status for a medication in a date range
    @Query("SELECT ml.status, COUNT(ml) FROM MedicationLog ml WHERE ml.medication.id = :medicationId AND ml.takenAt BETWEEN :from AND :to GROUP BY ml.status")
    List<Object[]> countByStatusForMedication(@Param("medicationId") Long medicationId, @Param("from") OffsetDateTime from, @Param("to") OffsetDateTime to);

    // All logs for an elderly person across all medications
    @Query("SELECT ml FROM MedicationLog ml JOIN ml.medication m WHERE m.elderly.id = :elderlyId AND ml.takenAt BETWEEN :from AND :to ORDER BY ml.takenAt DESC")
    List<MedicationLog> findAllByElderlyIdAndDateRange(@Param("elderlyId") Long elderlyId, @Param("from") OffsetDateTime from, @Param("to") OffsetDateTime to);

    List<MedicationLog> findByMedicationIdAndStatusOrderByTakenAtDesc(Long medicationId, MedicationLogStatus status);
}
