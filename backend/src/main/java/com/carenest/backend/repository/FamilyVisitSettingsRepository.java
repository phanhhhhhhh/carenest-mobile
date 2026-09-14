package com.carenest.backend.repository;

import com.carenest.backend.entity.FamilyVisitSettings;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FamilyVisitSettingsRepository extends JpaRepository<FamilyVisitSettings, Long> {

    Optional<FamilyVisitSettings> findByElderlyId(Long elderlyId);

    List<FamilyVisitSettings> findByCurrentStreakGreaterThan(int streak);

    @Query("select s.id from FamilyVisitSettings s where s.enabled = true order by s.id")
    List<Long> findEnabledIds();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from FamilyVisitSettings s join fetch s.elderly where s.id = :id")
    Optional<FamilyVisitSettings> findByIdForReminderUpdate(@Param("id") Long id);
}
