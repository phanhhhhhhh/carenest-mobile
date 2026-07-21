package com.carenest.backend.repository;

import com.carenest.backend.entity.EmergencyEvent;
import com.carenest.backend.entity.EmergencyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
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

    Optional<EmergencyEvent> findById(Long id);
}