package com.carenest.backend.repository;

import com.carenest.backend.entity.CheckIn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CheckInRepository extends JpaRepository<CheckIn, Long> {

    Optional<CheckIn> findTopByElderlyIdOrderByCreatedAtDesc(Long elderlyId);

    List<CheckIn> findByElderlyIdOrderByCreatedAtDesc(Long elderlyId);

    List<CheckIn> findByElderlyIdAndCreatedAtBetweenOrderByCreatedAtDesc(
        Long elderlyId, OffsetDateTime from, OffsetDateTime to);
}
