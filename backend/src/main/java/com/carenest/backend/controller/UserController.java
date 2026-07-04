package com.carenest.backend.controller;

import com.carenest.backend.dto.user.FcmTokenRequest;
import com.carenest.backend.dto.user.NotificationPreferencesRequest;
import com.carenest.backend.dto.user.NotificationPreferencesResponse;
import com.carenest.backend.entity.NotificationPreferences;
import com.carenest.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ── Notification Preferences ──────────────────────────────────────────

    @GetMapping("/users/{userId}/notification-preferences")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #userId)")
    public ResponseEntity<NotificationPreferencesResponse> getPreferences(
        @PathVariable Long userId
    ) {
        NotificationPreferences prefs = userService.getNotificationPreferences(userId);
        return ResponseEntity.ok(NotificationPreferencesResponse.from(prefs));
    }

    @PutMapping("/users/{userId}/notification-preferences")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #userId)")
    public ResponseEntity<NotificationPreferencesResponse> updatePreferences(
        @PathVariable Long userId,
        @Valid @RequestBody NotificationPreferencesRequest request
    ) {
        NotificationPreferences updated = userService.updateNotificationPreferences(
            userId, request);
        return ResponseEntity.ok(NotificationPreferencesResponse.from(updated));
    }

    // ── FCM Token ─────────────────────────────────────────────────────────

    @PutMapping("/users/{userId}/fcm-token")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #userId)")
    public ResponseEntity<Map<String, String>> updateFcmToken(
        @PathVariable Long userId,
        @Valid @RequestBody FcmTokenRequest request
    ) {
        userService.updateFcmToken(userId, request.getFcmToken());
        return ResponseEntity.ok(Map.of("message", "FCM token đã được cập nhật"));
    }
}
