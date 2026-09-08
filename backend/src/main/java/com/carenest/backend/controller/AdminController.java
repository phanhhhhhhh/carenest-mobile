package com.carenest.backend.controller;

import com.carenest.backend.dto.admin.AdminOverviewResponse;
import com.carenest.backend.dto.admin.AdminSubscriptionResponse;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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

    @GetMapping("/subscriptions")
    public ResponseEntity<Page<AdminSubscriptionResponse>> subscriptions(
        @RequestParam(required = false) String status,
        @PageableDefault(size = 25) Pageable pageable
    ) {
        return ResponseEntity.ok(adminService.subscriptions(status, pageable));
    }
}
