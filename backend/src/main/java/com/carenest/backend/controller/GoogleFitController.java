package com.carenest.backend.controller;

import com.carenest.backend.entity.User;
import com.carenest.backend.exception.NotFoundException;
import com.carenest.backend.repository.UserRepository;
import com.carenest.backend.service.GoogleFitService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * UC-10: Google Fit OAuth integration controller.
 * Handles OAuth authorization flow, connection status, and disconnect.
 */
@Slf4j
@RestController
@RequestMapping("/api/google-fit")
@RequiredArgsConstructor
public class GoogleFitController {

    private final GoogleFitService googleFitService;
    private final UserRepository userRepository;

    /**
     * UC-10: Get Google Fit OAuth authorization URL.
     * The client should redirect the user to this URL for consent.
     */
    @GetMapping("/connect/{userId}")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #userId)")
    public ResponseEntity<Map<String, Object>> authorize(@PathVariable Long userId) {
        if (!googleFitService.isConfigured()) {
            return ResponseEntity.status(503).body(Map.of(
                "error", "Google Fit is not configured",
                "message", "GOOGLE_FIT_CLIENT_ID and GOOGLE_FIT_CLIENT_SECRET must be set"
            ));
        }
        String authUrl = googleFitService.getAuthorizationUrl(userId);
        return ResponseEntity.ok(Map.of(
            "authUrl", authUrl,
            "message", "Redirect the user to this URL for Google Fit authorization"
        ));
    }

    /**
     * UC-10: Handle OAuth callback from Google.
     * Google redirects here with a code and state parameter after user consent.
     * No authentication required — this is a redirect from Google's OAuth page.
     */
    @GetMapping("/callback")
    public ResponseEntity<Map<String, String>> callback(
        @RequestParam("code") String code,
        @RequestParam("state") String state
    ) {
        // Extract userId from state (format: "userId:uuid")
        Long userId;
        try {
            String userIdStr = state.split(":")[0];
            userId = Long.valueOf(userIdStr);
        } catch (Exception e) {
            log.warn("Invalid state parameter in Google Fit callback: {}", state);
            return ResponseEntity.badRequest().body(Map.of(
                "status", "ERROR",
                "message", "Invalid state parameter"
            ));
        }

        try {
            googleFitService.handleOAuthCallback(code, userId);
            log.info("Google Fit OAuth callback successful for userId={}", userId);
            return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "Google Fit connected successfully"
            ));
        } catch (Exception e) {
            log.error("Google Fit OAuth callback failed for userId={}: {}", userId, e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "status", "ERROR",
                "message", "Failed to connect Google Fit: " + e.getMessage()
            ));
        }
    }

    /**
     * UC-10: Check Google Fit connection status for a user.
     */
    @GetMapping("/status/{userId}")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #userId)")
    public ResponseEntity<Map<String, Object>> status(@PathVariable Long userId) {
        boolean connected = googleFitService.isConnected(userId);
        boolean configured = googleFitService.isConfigured();

        return ResponseEntity.ok(Map.of(
            "connected", connected,
            "configured", configured
        ));
    }

    /**
     * UC-10: Disconnect Google Fit for a user.
     * Revokes OAuth tokens and stops data syncing.
     */
    @PostMapping("/disconnect/{userId}")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #userId)")
    public ResponseEntity<Map<String, String>> disconnect(@PathVariable Long userId) {
        googleFitService.disconnect(userId);
        return ResponseEntity.ok(Map.of(
            "status", "DISCONNECTED",
            "message", "Google Fit disconnected successfully"
        ));
    }

    /**
     * UC-10: Trigger a manual sync of Google Fit data for a user.
     */
    @PostMapping("/sync/{userId}")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #userId)")
    public ResponseEntity<Map<String, Object>> syncNow(@PathVariable Long userId) {
        if (!googleFitService.isConnected(userId)) {
            return ResponseEntity.badRequest().body(Map.of(
                "status", "NOT_CONNECTED",
                "message", "Google Fit is not connected for this user"
            ));
        }

        User elderly = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("User not found: " + userId));

        Map<String, Object> result = googleFitService.syncHealthData(elderly);
        return ResponseEntity.ok(result);
    }
}
