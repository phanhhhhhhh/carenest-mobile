package com.carenest.backend.repository;

import com.carenest.backend.entity.EmergencyEvent;
import com.carenest.backend.entity.EmergencyStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmergencyEventRepository extends JpaRepository<EmergencyEvent, Long> {

    Optional<EmergencyEvent> findTopByElderlyIdAndStatusOrderByTriggeredAtDesc(
            Long elderlyId, EmergencyStatus status);

    List<EmergencyEvent> findByElderlyIdOrderByTriggeredAtDesc(Long elderlyId);

    List<EmergencyEvent> findByElderlyIdAndStatusOrderByTriggeredAtDesc(Long elderlyId, EmergencyStatus status);

    List<EmergencyEvent> findByElderlyIdInAndStatus(List<Long> elderlyIds, EmergencyStatus status);

    List<EmergencyEvent> findByStatusAndAcknowledgedAtIsNullOrderByTriggeredAtAsc(EmergencyStatus status);

    Optional<EmergencyEvent> findById(Long id);

    long countByStatus(EmergencyStatus status);

    @Query("SELECT e FROM EmergencyEvent e JOIN FETCH e.elderly "
        + "WHERE (:status IS NULL OR e.status = :status) "
        + "ORDER BY e.triggeredAt DESC")
    Page<EmergencyEvent> findForAdmin(@Param("status") EmergencyStatus status, Pageable pageable);
}