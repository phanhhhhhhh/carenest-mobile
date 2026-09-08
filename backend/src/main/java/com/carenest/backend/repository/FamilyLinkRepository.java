package com.carenest.backend.repository;

import com.carenest.backend.entity.FamilyLink;
import com.carenest.backend.entity.FamilyLinkStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FamilyLinkRepository extends JpaRepository<FamilyLink, Long> {

    @Query("SELECT fl FROM FamilyLink fl JOIN FETCH fl.family WHERE fl.elderly.id = :elderlyId AND fl.status = :status AND fl.deletedAt IS NULL")
    List<FamilyLink> findAllFamilyByElderlyIdAndStatus(@Param("elderlyId") Long elderlyId, @Param("status") FamilyLinkStatus status);

    @Query("SELECT fl FROM FamilyLink fl JOIN FETCH fl.elderly WHERE fl.family.id = :familyId AND fl.status = :status AND fl.deletedAt IS NULL")
    List<FamilyLink> findAllElderlyByFamilyIdAndStatus(@Param("familyId") Long familyId, @Param("status") FamilyLinkStatus status);

    @Query("SELECT fl FROM FamilyLink fl JOIN FETCH fl.family WHERE fl.elderly.id IN :elderlyIds AND fl.status = :status AND fl.deletedAt IS NULL")
    List<FamilyLink> findAllFamilyByElderlyIdInAndStatus(@Param("elderlyIds") List<Long> elderlyIds, @Param("status") FamilyLinkStatus status);

    Optional<FamilyLink> findByElderlyIdAndFamilyIdAndDeletedAtIsNull(Long elderlyId, Long familyId);

    boolean existsByElderlyIdAndFamilyIdAndStatusAndDeletedAtIsNull(Long elderlyId, Long familyId, FamilyLinkStatus status);

    List<FamilyLink> findByElderlyIdAndDeletedAtIsNull(Long elderlyId);

    Optional<FamilyLink> findByIdAndDeletedAtIsNull(Long id);

    long countByStatusAndDeletedAtIsNull(FamilyLinkStatus status);

    @Query("SELECT fl FROM FamilyLink fl JOIN FETCH fl.elderly JOIN FETCH fl.family "
        + "WHERE fl.deletedAt IS NULL AND (:status IS NULL OR fl.status = :status) "
        + "ORDER BY fl.createdAt DESC")
    Page<FamilyLink> findForAdmin(@Param("status") FamilyLinkStatus status, Pageable pageable);

    @Query("SELECT fl FROM FamilyLink fl JOIN FETCH fl.family "
        + "WHERE fl.elderly.id = :elderlyId AND fl.deletedAt IS NULL")
    List<FamilyLink> findAllForElderly(@Param("elderlyId") Long elderlyId);
}