package com.carenest.backend.repository;

import com.carenest.backend.entity.CameraSnapshot;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface CameraSnapshotRepository extends JpaRepository<CameraSnapshot, Long> {

    Page<CameraSnapshot> findByElderlyIdOrderByCreatedAtDesc(Long elderlyId, Pageable pageable);

    List<CameraSnapshot> findByElderlyIdAndCreatedAtAfterOrderByCreatedAtDesc(Long elderlyId, Instant after);

    List<CameraSnapshot> findByEmergencyEventId(Long emergencyEventId);

    long countByElderlyIdAndCreatedAtAfter(Long elderlyId, Instant after);

    long deleteByCreatedAtBefore(Instant cutoff);
}
