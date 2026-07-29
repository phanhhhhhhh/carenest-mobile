package com.carenest.backend.controller;

import com.carenest.backend.dto.googlefit.GoogleFitStatusResponse;
import com.carenest.backend.entity.User;
import com.carenest.backend.exception.NotFoundException;
import com.carenest.backend.repository.UserRepository;
import com.carenest.backend.security.AuthorizationService;
import com.carenest.backend.service.GoogleFitService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;


@Slf4j
@RestController
@RequestMapping("/api/google-fit")
@RequiredArgsConstructor
public class GoogleFitController {

    private final GoogleFitService googleFitService;
    private final UserRepository userRepository;
    private final AuthorizationService authorizationService;

    
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

    
    @GetMapping("/callback")
    public ResponseEntity<Map<String, String>> callback(
        @RequestParam("code") String code,
        @RequestParam("state") String state
    ) {
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

        // The OAuth "state" only carries the userId the flow was started for — it is never
        // itself validated against the authenticated caller. Without this check, any logged-in
        // user could swap userId in state and bind their own Google consent to a victim's account.
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long principalId = (authentication != null && authentication.getPrincipal() instanceof Long)
            ? (Long) authentication.getPrincipal()
            : null;
        if (!authorizationService.isOwnerOrLinkedFamily(principalId, userId)) {
            log.warn("Google Fit callback rejected: principal={} is not owner/linked family of userId={}",
                principalId, userId);
            throw new AccessDeniedException("Not authorized to connect Google Fit for this user");
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

    
    @GetMapping("/status/{userId}")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #userId)")
    public ResponseEntity<GoogleFitStatusResponse> status(@PathVariable Long userId) {
        boolean connected = googleFitService.isConnected(userId);
        boolean configured = googleFitService.isConfigured();

        return ResponseEntity.ok(GoogleFitStatusResponse.builder()
                .connected(connected)
                .configured(configured)
                .build());
    }

    
    @PostMapping("/disconnect/{userId}")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #userId)")
    public ResponseEntity<Map<String, String>> disconnect(@PathVariable Long userId) {
        googleFitService.disconnect(userId);
        return ResponseEntity.ok(Map.of(
            "status", "DISCONNECTED",
            "message", "Google Fit disconnected successfully"
        ));
    }

    
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
