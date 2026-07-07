package com.carenest.backend.controller;

import com.carenest.backend.dto.auth.*;
import com.carenest.backend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // ═══════════════════════════════════════════════════════════════════════
    // Register & Login
    // ═══════════════════════════════════════════════════════════════════════

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(
        @Valid @RequestBody RegisterRequest request
    ) {
        Map<String, Object> response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
        @Valid @RequestBody LoginRequest request,
        HttpServletRequest httpRequest
    ) {
        AuthResponse response = authService.login(request, httpRequest.getHeader("User-Agent"));
        return ResponseEntity.ok(response);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Email Verification
    // ═══════════════════════════════════════════════════════════════════════

    @PostMapping("/verify-email")
    public ResponseEntity<Map<String, String>> verifyEmail(
        @Valid @RequestBody VerifyEmailRequest request
    ) {
        authService.verifyEmail(request.getToken());
        return ResponseEntity.ok(Map.of("message", "Email verified successfully. You can now log in."));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Map<String, String>> resendVerification(
        @Valid @RequestBody ResendVerificationRequest request
    ) {
        authService.resendVerificationEmail(request.getEmail());
        return ResponseEntity.ok(Map.of(
            "message", "Verification email sent. Please check your inbox."
        ));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Token Management
    // ═══════════════════════════════════════════════════════════════════════

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        return ResponseEntity.ok(authService.refresh(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal Long userId) {
        authService.logout(userId);
        return ResponseEntity.noContent().build();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Password Management
    // ═══════════════════════════════════════════════════════════════════════

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
        @AuthenticationPrincipal Long userId,
        @Valid @RequestBody ChangePasswordRequest request
    ) {
        authService.changePassword(userId, request);
        return ResponseEntity.ok(Map.of(
            "message", "Password changed successfully. Please log in again with your new password."
        ));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(
        @Valid @RequestBody ForgotPasswordRequest request
    ) {
        authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(Map.of(
            "message", "If an account exists with that email, a password reset link has been sent."
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
        @Valid @RequestBody ResetPasswordRequest request
    ) {
        authService.resetPassword(
            request.getToken(),
            request.getNewPassword(),
            request.getConfirmPassword()
        );
        return ResponseEntity.ok(Map.of(
            "message", "Password reset successfully. You can now log in with your new password."
        ));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PIN Management
    // ═══════════════════════════════════════════════════════════════════════

    @PostMapping("/setup-pin")
    public ResponseEntity<Map<String, String>> setupPin(
        @AuthenticationPrincipal Long userId,
        @Valid @RequestBody SetupPinRequest request
    ) {
        authService.setupPin(userId, request.getPin(), request.getConfirmPin());
        return ResponseEntity.ok(Map.of("message", "PIN set up successfully"));
    }

    @PostMapping("/verify-pin")
    public ResponseEntity<Map<String, Object>> verifyPin(
        @AuthenticationPrincipal Long userId,
        @RequestBody Map<String, String> body
    ) {
        String pin = body.get("pin");
        if (pin == null || pin.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "PIN is required"));
        }
        boolean valid = authService.verifyPin(userId, pin);
        return ResponseEntity.ok(Map.of("valid", valid));
    }
}
