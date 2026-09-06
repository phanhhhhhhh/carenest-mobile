package com.carenest.backend.controller;

import com.carenest.backend.dto.digest.DailyDigestResponse;
import com.carenest.backend.entity.Notification;
import com.carenest.backend.service.FamilyDigestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;
import java.util.Objects;

/** AI Family Digest (UC A6). */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FamilyDigestController {

    private final FamilyDigestService familyDigestService;

    /** The most recent daily digest addressed to the calling family member. */
    @GetMapping("/family/digest/latest")
    @PreAuthorize("hasRole('FAMILY')")
    public ResponseEntity<DailyDigestResponse> latest(@AuthenticationPrincipal Long familyUserId) {
        Notification n = familyDigestService.getLatestForUser(familyUserId);
        if (n == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(DailyDigestResponse.builder()
            .id(n.getId())
            .title(n.getTitle())
            .body(n.getBody())
            .date(n.getData() != null ? Objects.toString(n.getData().get("date"), null) : null)
            .quietDay(n.getData() != null && "true".equals(Objects.toString(n.getData().get("quietDay"), "false")))
            .createdAt(n.getCreatedAt())
            .build());
    }

    /** Generate today's digest on demand (also produced automatically at 20:00). */
    @PostMapping("/elderly/{elderlyId}/digest/generate")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #elderlyId)")
    public ResponseEntity<Map<String, Object>> generate(@PathVariable Long elderlyId) {
        FamilyDigestService.GeneratedDigest d = familyDigestService.generateForElderly(
            elderlyId, LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")));
        if (d == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(Map.of(
            "text", d.text(),
            "quietDay", d.quietDay(),
            "aiGenerated", d.aiGenerated()));
    }
}
