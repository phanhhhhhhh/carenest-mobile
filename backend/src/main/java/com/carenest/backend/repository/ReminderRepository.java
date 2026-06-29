package com.carenest.backend.repository;

import com.carenest.backend.entity.Reminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface ReminderRepository extends JpaRepository<Reminder, Long> {
    List<Reminder> findByElderlyIdAndIsActiveTrueAndDeletedAtIsNull(Long elderlyId);
    List<Reminder> findByIsActiveTrueAndDeletedAtIsNullAndRemindAtBetween(OffsetDateTime from, OffsetDateTime to);
}