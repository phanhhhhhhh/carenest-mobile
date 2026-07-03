package com.carenest.backend.controller;

import com.carenest.backend.dto.reminder.ReminderRequest;
import com.carenest.backend.dto.reminder.ReminderResponse;
import com.carenest.backend.service.ReminderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ReminderController {

    private final ReminderService reminderService;

    @PostMapping("/reminders")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #request.elderlyId)")
    public ResponseEntity<ReminderResponse> create(
        @Valid @RequestBody ReminderRequest request,
        @AuthenticationPrincipal Long createdById
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reminderService.create(request, createdById));
    }

    @GetMapping("/users/{userId}/reminders")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #userId)")
    public ResponseEntity<List<ReminderResponse>> getByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(reminderService.getByUserId(userId));
    }

    @PatchMapping("/reminders/{id}")
    @PreAuthorize("@authz.canAccessReminder(authentication.principal, #id)")
    public ResponseEntity<ReminderResponse> update(
        @PathVariable Long id,
        @Valid @RequestBody ReminderRequest request
    ) {
        return ResponseEntity.ok(reminderService.update(id, request));
    }

    @DeleteMapping("/reminders/{id}")
    @PreAuthorize("@authz.canAccessReminder(authentication.principal, #id)")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        reminderService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
