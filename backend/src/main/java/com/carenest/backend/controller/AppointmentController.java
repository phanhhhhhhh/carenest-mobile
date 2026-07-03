package com.carenest.backend.controller;

import com.carenest.backend.dto.appointment.AppointmentRequest;
import com.carenest.backend.dto.appointment.AppointmentResponse;
import com.carenest.backend.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping("/appointments")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #request.elderlyId)")
    public ResponseEntity<AppointmentResponse> create(
        @Valid @RequestBody AppointmentRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(appointmentService.create(request));
    }

    @GetMapping("/users/{userId}/appointments")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #userId)")
    public ResponseEntity<List<AppointmentResponse>> getByUserId(
        @PathVariable Long userId
    ) {
        return ResponseEntity.ok(appointmentService.getByUserId(userId));
    }

    @GetMapping("/appointments/{id}")
    @PreAuthorize("@authz.canAccessAppointment(authentication.principal, #id)")
    public ResponseEntity<AppointmentResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.getById(id));
    }

    @PatchMapping("/appointments/{id}")
    @PreAuthorize("@authz.canAccessAppointment(authentication.principal, #id)")
    public ResponseEntity<AppointmentResponse> update(
        @PathVariable Long id,
        @Valid @RequestBody AppointmentRequest request
    ) {
        return ResponseEntity.ok(appointmentService.update(id, request));
    }

    @DeleteMapping("/appointments/{id}")
    @PreAuthorize("@authz.canAccessAppointment(authentication.principal, #id)")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        appointmentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
