package com.carenest.backend.repository;

import com.carenest.backend.entity.EmergencyEvent;
import com.carenest.backend.entity.EmergencyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmergencyEventRepository extends JpaRepository<EmergencyEvent, Long> {

    // Tìm event SOS đang active của một elderly (cho family xem)
    Optional<EmergencyEvent> findTopByElderlyIdAndStatusOrderByTriggeredAtDesc(
            Long elderlyId, EmergencyStatus status);

    // Lịch sử SOS của một elderly
    List<EmergencyEvent> findByElderlyIdOrderByTriggeredAtDesc(Long elderlyId);
}
