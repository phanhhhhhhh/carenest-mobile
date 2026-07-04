package com.carenest.backend.service;

import com.carenest.backend.dto.reminder.ReminderRequest;
import com.carenest.backend.dto.reminder.ReminderResponse;
import com.carenest.backend.entity.Reminder;
import com.carenest.backend.entity.RepeatRule;
import com.carenest.backend.entity.User;
import com.carenest.backend.exception.NotFoundException;
import com.carenest.backend.repository.ReminderRepository;
import com.carenest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ReminderService {

    private final ReminderRepository reminderRepository;
    private final UserRepository userRepository;

    public ReminderResponse create(ReminderRequest request, Long createdById) {
        User elderly = userRepository.findById(request.getElderlyId())
            .orElseThrow(() -> new NotFoundException("User (elderly) not found: " + request.getElderlyId()));

        User createdBy = userRepository.findById(createdById)
            .orElseThrow(() -> new NotFoundException("User (createdBy) not found: " + createdById));

        Reminder reminder = Reminder.builder()
            .elderly(elderly)
            .createdBy(createdBy)
            .title(request.getTitle())
            .remindAt(request.getRemindAt())
            .repeatRule(request.getRepeatRule())
            .isActive(true)
            .build();

        return toResponse(reminderRepository.save(reminder));
    }

    @Transactional(readOnly = true)
    public List<ReminderResponse> getByUserId(Long userId) {
        return reminderRepository.findByElderlyIdAndIsActiveTrueAndDeletedAtIsNull(userId)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    public ReminderResponse update(Long id, ReminderRequest request) {
        Reminder reminder = findOrThrow(id);

        if (request.getTitle() != null) {
            reminder.setTitle(request.getTitle());
        }
        if (request.getRemindAt() != null) {
            reminder.setRemindAt(request.getRemindAt());
        }
        if (request.getRepeatRule() != null) {
            reminder.setRepeatRule(request.getRepeatRule());
        }

        return toResponse(reminderRepository.save(reminder));
    }

    public void delete(Long id) {
        Reminder reminder = findOrThrow(id);
        reminder.setDeletedAt(OffsetDateTime.now());
        reminder.setIsActive(false);
        reminderRepository.save(reminder);
    }

    public void save(Reminder reminder) {
        reminderRepository.save(reminder);
    }

    @Transactional(readOnly = true)
    public List<Reminder> findDueReminders(OffsetDateTime from, OffsetDateTime to) {
        return reminderRepository.findByIsActiveTrueAndDeletedAtIsNullAndRemindAtBetween(from, to);
    }

    public void updateNextRemindAt(Reminder reminder) {
        RepeatRule rule = reminder.getRepeatRule();
        if (rule == null || rule == RepeatRule.NONE) {
            reminder.setIsActive(false);
        } else {
            switch (rule) {
                case DAILY:
                    reminder.setRemindAt(reminder.getRemindAt().plusDays(1));
                    break;
                case WEEKLY:
                    reminder.setRemindAt(reminder.getRemindAt().plusWeeks(1));
                    break;
                case MONTHLY:
                    reminder.setRemindAt(reminder.getRemindAt().plusMonths(1));
                    break;
            }
        }
        reminderRepository.save(reminder);
    }

    private Reminder findOrThrow(Long id) {
        return reminderRepository.findById(id)
            .filter(r -> r.getDeletedAt() == null)
            .orElseThrow(() -> new NotFoundException("Reminder not found: " + id));
    }

    private ReminderResponse toResponse(Reminder r) {
        return ReminderResponse.builder()
            .id(r.getId())
            .elderlyId(r.getElderly().getId())
            .elderlyName(r.getElderly().getName())
            .createdById(r.getCreatedBy() != null ? r.getCreatedBy().getId() : null)
            .createdByName(r.getCreatedBy() != null ? r.getCreatedBy().getName() : null)
            .title(r.getTitle())
            .remindAt(r.getRemindAt())
            .repeatRule(r.getRepeatRule())
            .isActive(r.getIsActive())
            .createdAt(r.getCreatedAt())
            .updatedAt(r.getUpdatedAt())
            .build();
    }
}
