package com.carenest.backend.controller;

import com.carenest.backend.dto.admin.AdminAppointmentResponse;
import com.carenest.backend.dto.admin.AdminCameraResponse;
import com.carenest.backend.dto.admin.AdminCheckInResponse;
import com.carenest.backend.dto.admin.AdminElderlyResponse;
import com.carenest.backend.dto.admin.AdminEmergencyResponse;
import com.carenest.backend.dto.admin.AdminFamilyLinkResponse;
import com.carenest.backend.dto.admin.AdminHealthMetricResponse;
import com.carenest.backend.dto.admin.AdminMedicationResponse;
import com.carenest.backend.dto.admin.AdminNotificationResponse;
import com.carenest.backend.dto.admin.AdminOverviewResponse;
import com.carenest.backend.dto.admin.AdminSubscriptionResponse;
import com.carenest.backend.dto.admin.AdminUserDetailResponse;
import com.carenest.backend.dto.admin.AdminUserResponse;
import com.carenest.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Read-only operator console API. All endpoints require ROLE_ADMIN. */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/overview")
    public ResponseEntity<AdminOverviewResponse> overview() {
        return ResponseEntity.ok(adminService.overview());
    }

    @GetMapping("/users")
    public ResponseEntity<Page<AdminUserResponse>> users(
        @RequestParam(required = false) String role,
        @RequestParam(required = false) String query,
        @PageableDefault(size = 25, sort = "id", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(adminService.users(role, query, pageable));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<AdminUserDetailResponse> userDetail(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.userDetail(id));
    }

    @GetMapping("/subscriptions")
    public ResponseEntity<Page<AdminSubscriptionResponse>> subscriptions(
        @RequestParam(required = false) String status,
        @PageableDefault(size = 25) Pageable pageable
    ) {
        return ResponseEntity.ok(adminService.subscriptions(status, pageable));
    }

    @GetMapping("/elderly")
    public ResponseEntity<Page<AdminElderlyResponse>> elderly(
        @PageableDefault(size = 25) Pageable pageable
    ) {
        return ResponseEntity.ok(adminService.elderly(pageable));
    }

    @GetMapping("/family-links")
    public ResponseEntity<Page<AdminFamilyLinkResponse>> familyLinks(
        @RequestParam(required = false) String status,
        @PageableDefault(size = 25) Pageable pageable
    ) {
        return ResponseEntity.ok(adminService.familyLinks(status, pageable));
    }

    @GetMapping("/emergencies")
    public ResponseEntity<Page<AdminEmergencyResponse>> emergencies(
        @RequestParam(required = false) String status,
        @PageableDefault(size = 25) Pageable pageable
    ) {
        return ResponseEntity.ok(adminService.emergencies(status, pageable));
    }

    @GetMapping("/check-ins")
    public ResponseEntity<Page<AdminCheckInResponse>> checkIns(
        @PageableDefault(size = 25) Pageable pageable
    ) {
        return ResponseEntity.ok(adminService.checkIns(pageable));
    }

    @GetMapping("/medications")
    public ResponseEntity<Page<AdminMedicationResponse>> medications(
        @PageableDefault(size = 25) Pageable pageable
    ) {
        return ResponseEntity.ok(adminService.medications(pageable));
    }

    @GetMapping("/health-metrics")
    public ResponseEntity<Page<AdminHealthMetricResponse>> healthMetrics(
        @RequestParam(required = false) String type,
        @PageableDefault(size = 25) Pageable pageable
    ) {
        return ResponseEntity.ok(adminService.healthMetrics(type, pageable));
    }

    @GetMapping("/cameras")
    public ResponseEntity<Page<AdminCameraResponse>> cameras(
        @PageableDefault(size = 25) Pageable pageable
    ) {
        return ResponseEntity.ok(adminService.cameras(pageable));
    }

    @GetMapping("/notifications")
    public ResponseEntity<Page<AdminNotificationResponse>> notifications(
        @RequestParam(required = false) String type,
        @PageableDefault(size = 25) Pageable pageable
    ) {
        return ResponseEntity.ok(adminService.notifications(type, pageable));
    }

    @GetMapping("/appointments")
    public ResponseEntity<Page<AdminAppointmentResponse>> appointments(
        @RequestParam(required = false) String status,
        @PageableDefault(size = 25) Pageable pageable
    ) {
        return ResponseEntity.ok(adminService.appointments(status, pageable));
    }
}
