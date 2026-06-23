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

    List<Medication> findAllByElderlyIdAndDeletedAtIsNull(Long elderlyId);

    List<Medication> findByElderlyIdAndDeletedAtIsNull(Long elderlyId);

    Optional<Medication> findByIdAndDeletedAtIsNull(Long id);

    // Critical for medication reminder scheduler: find all active medications with overdue dose time
    @Query("SELECT m FROM Medication m JOIN FETCH m.elderly WHERE m.nextDoseTime <= :now AND m.deletedAt IS NULL ORDER BY m.nextDoseTime ASC")
    List<Medication> findAllOverdueMedications(@Param("now") OffsetDateTime now);

    // For a specific elderly, find medications with next dose within a time window
    @Query("SELECT m FROM Medication m WHERE m.elderly.id = :elderlyId AND m.nextDoseTime BETWEEN :from AND :to AND m.deletedAt IS NULL ORDER BY m.nextDoseTime ASC")
    List<Medication> findUpcomingByElderlyId(@Param("elderlyId") Long elderlyId, @Param("from") OffsetDateTime from, @Param("to") OffsetDateTime to);
}
