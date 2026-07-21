package com.carenest.backend.repository;

import com.carenest.backend.entity.SchedulerState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SchedulerStateRepository extends JpaRepository<SchedulerState, String> {
    Optional<SchedulerState> findByJobName(String jobName);
}
