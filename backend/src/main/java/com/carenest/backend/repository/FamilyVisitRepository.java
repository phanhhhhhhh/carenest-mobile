package com.carenest.backend.repository;

import com.carenest.backend.entity.FamilyVisit;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface FamilyVisitRepository extends JpaRepository<FamilyVisit, Long> {

    /**
     * Complete lightweight history for Java-side ICT cycle reduction. Keeping
     * date bucketing out of SQL avoids PostgreSQL-specific date_trunc behavior
     * in repository tests while avoiding FamilyVisit/member entity hydration.
     */
    @Query("select v.visitedAt from FamilyVisit v where v.elderly.id = :elderlyId "
        + "order by v.visitedAt asc")
    List<OffsetDateTime> findVisitTimestampsByElderlyId(@Param("elderlyId") Long elderlyId);

    @Query("select v from FamilyVisit v join fetch v.member where v.elderly.id = :elderlyId "
        + "order by v.visitedAt desc")
    List<FamilyVisit> findRecentByElderlyId(
        @Param("elderlyId") Long elderlyId,
        Pageable pageable
    );

    @Query("select v from FamilyVisit v where v.elderly.id = :elderlyId "
        + "and v.visitedAt between :from and :to order by v.visitedAt desc")
    List<FamilyVisit> findInRange(@Param("elderlyId") Long elderlyId,
                                  @Param("from") OffsetDateTime from,
                                  @Param("to") OffsetDateTime to);
}
