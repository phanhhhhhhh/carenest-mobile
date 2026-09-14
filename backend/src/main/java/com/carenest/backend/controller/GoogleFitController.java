package com.carenest.backend.controller;

import com.carenest.backend.dto.googlefit.GoogleFitStatusResponse;
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


@Slf4j
@RestController
@RequestMapping("/api/google-fit")
@RequiredArgsConstructor
public class GoogleFitController {

    private final GoogleFitService googleFitService;
    private final UserRepository userRepository;

    
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
        // Google's redirect carries no Bearer token, so this endpoint is unauthenticated
        // (permitAll in SecurityConfig). Authorization instead comes from `state`: an opaque,
        // single-use, short-lived nonce that GoogleFitService only minted after the original
        // caller already passed isOwnerOrLinkedFamily on /connect/{userId} — it resolves and
        // consumes the nonce itself, so the target userId is never taken from client input here.
        try {
            googleFitService.handleOAuthCallback(code, state);
            log.info("Google Fit OAuth callback succeeded for state={}", state);
            return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "Google Fit connected successfully"
            ));
        } catch (com.carenest.backend.exception.UnauthorizedException e) {
            log.warn("Google Fit callback rejected: {}", e.getMessage());
            return ResponseEntity.status(401).body(Map.of(
                "status", "ERROR",
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Google Fit OAuth callback failed: {}", e.getMessage());
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
