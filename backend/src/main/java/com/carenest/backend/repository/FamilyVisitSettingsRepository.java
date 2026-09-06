package com.carenest.backend.repository;

import com.carenest.backend.entity.FamilyVisitSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FamilyVisitSettingsRepository extends JpaRepository<FamilyVisitSettings, Long> {

    Optional<FamilyVisitSettings> findByElderlyId(Long elderlyId);

    List<FamilyVisitSettings> findByCurrentStreakGreaterThan(int streak);
}
