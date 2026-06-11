package com.carenest.backend.repository;

import com.carenest.backend.entity.FamilyLink;
import com.carenest.backend.entity.FamilyLinkStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FamilyLinkRepository extends JpaRepository<FamilyLink, Long> {

    // Get all family members linked to a specific elderly
    @Query("SELECT fl FROM FamilyLink fl JOIN FETCH fl.family WHERE fl.elderly.id = :elderlyId AND fl.status = :status AND fl.deletedAt IS NULL")
    List<FamilyLink> findAllFamilyByElderlyIdAndStatus(@Param("elderlyId") Long elderlyId, @Param("status") FamilyLinkStatus status);

    // Get all elderly linked to a specific family member
    @Query("SELECT fl FROM FamilyLink fl JOIN FETCH fl.elderly WHERE fl.family.id = :familyId AND fl.status = :status AND fl.deletedAt IS NULL")
    List<FamilyLink> findAllElderlyByFamilyIdAndStatus(@Param("familyId") Long familyId, @Param("status") FamilyLinkStatus status);

    Optional<FamilyLink> findByElderlyIdAndFamilyIdAndDeletedAtIsNull(Long elderlyId, Long familyId);

    boolean existsByElderlyIdAndFamilyIdAndStatusAndDeletedAtIsNull(Long elderlyId, Long familyId, FamilyLinkStatus status);
}
