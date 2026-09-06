package com.carenest.backend.repository;

import com.carenest.backend.entity.FamilyVisit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface FamilyVisitRepository extends JpaRepository<FamilyVisit, Long> {

    List<FamilyVisit> findByElderlyIdOrderByVisitedAtDesc(Long elderlyId);

    @Query("select v from FamilyVisit v where v.elderly.id = :elderlyId "
        + "and v.visitedAt between :from and :to order by v.visitedAt desc")
    List<FamilyVisit> findInRange(@Param("elderlyId") Long elderlyId,
                                  @Param("from") OffsetDateTime from,
                                  @Param("to") OffsetDateTime to);
}
