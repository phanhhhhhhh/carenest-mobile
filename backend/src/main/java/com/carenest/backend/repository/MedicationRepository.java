package com.carenest.backend.repository;

import com.carenest.backend.entity.Medication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MedicationRepository extends JpaRepository<Medication, Long> {

    List<Medication> findByElderlyIdAndDeletedAtIsNull(Long elderlyId);

    Optional<Medication> findByIdAndDeletedAtIsNull(Long id);

    @Query("SELECT m FROM Medication m JOIN FETCH m.elderly WHERE m.nextDoseTime <= :now AND m.deletedAt IS NULL ORDER BY m.nextDoseTime ASC")
    List<Medication> findAllOverdueMedications(@Param("now") OffsetDateTime now);

    @Query("SELECT m FROM Medication m WHERE m.elderly.id = :elderlyId AND m.nextDoseTime BETWEEN :from AND :to AND m.deletedAt IS NULL ORDER BY m.nextDoseTime ASC")
    List<Medication> findUpcomingByElderlyId(@Param("elderlyId") Long elderlyId, @Param("from") OffsetDateTime from, @Param("to") OffsetDateTime to);

    @Query("SELECT m FROM Medication m JOIN FETCH m.elderly WHERE m.elderly.id IN :elderlyIds AND m.nextDoseTime BETWEEN :from AND :to AND m.deletedAt IS NULL ORDER BY m.nextDoseTime ASC")
    List<Medication> findUpcomingByElderlyIds(@Param("elderlyIds") List<Long> elderlyIds, @Param("from") OffsetDateTime from, @Param("to") OffsetDateTime to);

    @Query("SELECT m FROM Medication m JOIN FETCH m.elderly WHERE m.elderly.id IN :elderlyIds AND m.nextDoseTime <= :now AND m.deletedAt IS NULL ORDER BY m.nextDoseTime ASC")
    List<Medication> findOverdueByElderlyIds(@Param("elderlyIds") List<Long> elderlyIds, @Param("now") OffsetDateTime now);

    List<Medication> findByNextDoseTimeBetweenAndDeletedAtIsNull(OffsetDateTime from, OffsetDateTime to);

    @Query("SELECT COUNT(ml) > 0 FROM MedicationLog ml WHERE ml.medication.id = :medicationId AND ml.takenAt BETWEEN :from AND :to")
    boolean existsLogForMedicationInWindow(@Param("medicationId") Long medicationId, @Param("from") OffsetDateTime from, @Param("to") OffsetDateTime to);
}