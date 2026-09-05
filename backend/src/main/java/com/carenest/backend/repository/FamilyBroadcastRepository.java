package com.carenest.backend.repository;

import com.carenest.backend.entity.BroadcastStatus;
import com.carenest.backend.entity.FamilyBroadcast;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FamilyBroadcastRepository extends JpaRepository<FamilyBroadcast, Long> {

    List<FamilyBroadcast> findByStatusOrderByStartedAtAsc(BroadcastStatus status);

    List<FamilyBroadcast> findByElderlyIdAndStatus(Long elderlyId, BroadcastStatus status);
}
