package com.carenest.backend.service;

import com.carenest.backend.dto.checkin.CheckInRequest;
import com.carenest.backend.dto.checkin.CheckInResponse;
import com.carenest.backend.entity.CheckIn;
import com.carenest.backend.entity.CheckInSource;
import com.carenest.backend.entity.User;
import com.carenest.backend.entity.UserRole;
import com.carenest.backend.exception.NotFoundException;
import com.carenest.backend.repository.CheckInRepository;
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
public class CheckInService {

    private final CheckInRepository checkInRepository;
    private final UserRepository userRepository;

    public CheckInResponse create(Long elderlyId, CheckInRequest request) {
        User elderly = userRepository.findById(elderlyId)
            .orElseThrow(() -> new NotFoundException("User (elderly) not found: " + elderlyId));

        if (elderly.getRole() != UserRole.ELDERLY) {
            throw new IllegalArgumentException("elderlyId must be a user with ELDERLY role");
        }

        CheckIn checkIn = CheckIn.builder()
            .elderly(elderly)
            .mood(request.getMood())
            .note(request.getNote())
            .source(request.getSource() != null ? request.getSource() : CheckInSource.BUTTON)
            .build();

        return toResponse(checkInRepository.save(checkIn));
    }

    @Transactional(readOnly = true)
    public CheckInResponse getTodayLatest(Long elderlyId) {
        OffsetDateTime startOfDay = OffsetDateTime.now()
            .withHour(0).withMinute(0).withSecond(0).withNano(0);
        return checkInRepository
            .findByElderlyIdAndCreatedAtBetweenOrderByCreatedAtDesc(elderlyId, startOfDay, startOfDay.plusDays(1))
            .stream()
            .findFirst()
            .map(this::toResponse)
            .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<CheckInResponse> getHistory(Long elderlyId, OffsetDateTime from, OffsetDateTime to) {
        List<CheckIn> checkIns = (from != null && to != null)
            ? checkInRepository.findByElderlyIdAndCreatedAtBetweenOrderByCreatedAtDesc(elderlyId, from, to)
            : checkInRepository.findByElderlyIdOrderByCreatedAtDesc(elderlyId);
        return checkIns.stream().map(this::toResponse).collect(Collectors.toList());
    }

    private CheckInResponse toResponse(CheckIn c) {
        return CheckInResponse.builder()
            .id(c.getId())
            .elderlyId(c.getElderly().getId())
            .mood(c.getMood())
            .note(c.getNote())
            .source(c.getSource())
            .createdAt(c.getCreatedAt())
            .build();
    }
}
