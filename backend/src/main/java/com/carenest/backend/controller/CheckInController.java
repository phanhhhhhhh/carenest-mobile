package com.carenest.backend.controller;

import com.carenest.backend.dto.checkin.CheckInRequest;
import com.carenest.backend.dto.checkin.CheckInResponse;
import com.carenest.backend.service.CheckInService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CheckInController {

    private final CheckInService checkInService;

    @PostMapping("/elderly/{elderlyId}/check-ins")
    @PreAuthorize("hasRole('ELDERLY') and @authz.isOwnerOrLinkedFamily(authentication.principal, #elderlyId)")
    public ResponseEntity<CheckInResponse> create(
        @PathVariable Long elderlyId,
        @Valid @RequestBody CheckInRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(checkInService.create(elderlyId, request));
    }

    @GetMapping("/elderly/{elderlyId}/check-ins")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #elderlyId)")
    public ResponseEntity<List<CheckInResponse>> getHistory(
        @PathVariable Long elderlyId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to
    ) {
        return ResponseEntity.ok(checkInService.getHistory(elderlyId, from, to));
    }

    @GetMapping("/elderly/{elderlyId}/check-ins/today")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #elderlyId)")
    public ResponseEntity<CheckInResponse> getToday(@PathVariable Long elderlyId) {
        CheckInResponse today = checkInService.getTodayLatest(elderlyId);
        return today != null ? ResponseEntity.ok(today) : ResponseEntity.noContent().build();
    }
}
