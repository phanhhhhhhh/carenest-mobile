package com.carenest.backend.repository;

import com.carenest.backend.entity.Appointment;
import com.carenest.backend.entity.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByElderlyIdAndDatetimeBetweenAndDeletedAtIsNullOrderByDatetimeAsc(
        Long elderlyId, OffsetDateTime from, OffsetDateTime to);

    List<Appointment> findByElderlyIdInAndDatetimeBetweenAndDeletedAtIsNullOrderByDatetimeAsc(
        List<Long> elderlyIds, OffsetDateTime from, OffsetDateTime to);

    List<Appointment> findByElderlyIdAndStatusAndDeletedAtIsNullOrderByDatetimeAsc(
        Long elderlyId, AppointmentStatus status);

    @Query("""
        SELECT a FROM Appointment a
        JOIN FamilyLink fl ON fl.elderly.id = a.elderly.id
        WHERE fl.family.id = :familyId
          AND fl.status = com.carenest.backend.entity.FamilyLinkStatus.ACTIVE
          AND fl.deletedAt IS NULL
          AND a.datetime >= :from
          AND a.deletedAt IS NULL
        ORDER BY a.datetime ASC
        """)
    List<Appointment> findUpcomingForFamilyMember(@Param("familyId") Long familyId, @Param("from") OffsetDateTime from);
}