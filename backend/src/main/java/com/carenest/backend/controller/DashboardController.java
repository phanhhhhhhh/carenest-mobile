package com.carenest.backend.controller;

import com.carenest.backend.dto.dashboard.FamilyDashboardResponse;
import com.carenest.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/dashboard/family/{familyId}")
    @PreAuthorize("hasAnyRole('FAMILY', 'ADMIN') and (#familyId == authentication.principal or hasRole('ADMIN'))")
    public ResponseEntity<FamilyDashboardResponse> getFamilyDashboard(
        @PathVariable Long familyId
    ) {
        return ResponseEntity.ok(dashboardService.getFamilyDashboard(familyId));
    }
}
