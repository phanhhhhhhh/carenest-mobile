package com.carenest.backend.controller;

import com.carenest.backend.dto.auth.*;
import com.carenest.backend.entity.User;
import com.carenest.backend.repository.UserRepository;
import com.carenest.backend.service.AuthService;
import com.carenest.backend.service.JwtService;
import com.carenest.backend.service.OtpService;
import com.carenest.backend.exception.NotFoundException;
import com.carenest.backend.exception.ConflictException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;
import java.util.UUID;
import java.time.OffsetDateTime;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final OtpService otpService;
    private final UserRepository userRepository;
    private final JwtService jwtService;

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
    // OTP Verification (Email or SMS)
    // ═══════════════════════════════════════════════════════════════════════

    @PostMapping("/send-otp")
    public ResponseEntity<Map<String, String>> sendOtp(
        @Valid @RequestBody SendOtpRequest request
    ) {
        String target = request.getTarget().trim();

        // Check user exists
        User user = findUserByTarget(target);
        if (user.isEmailVerified()) {
            throw new ConflictException("Account is already verified. Please log in.");
        }

        if ("SMS".equalsIgnoreCase(request.getMethod())) {
            otpService.sendOtpViaSms(target, user.getName());
        } else {
            otpService.sendOtpViaEmail(target, user.getName());
        }

        return ResponseEntity.ok(Map.of(
            "message", "Verification code sent to " + target
        ));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, Object>> verifyOtp(
        @Valid @RequestBody VerifyOtpRequest request
    ) {
        String target = request.getTarget().trim();
        boolean valid = otpService.verifyOtp(target, request.getCode());

        if (!valid) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Invalid or expired verification code"));
        }

        // Mark user as verified
        User user = findUserByTarget(target);
        user.setEmailVerified(true);
        user.setEmailVerificationToken(null);
        user.setEmailVerificationExpiry(null);
        userRepository.save(user);

        // Auto-login: return tokens
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Verification successful! Welcome to CareNest, " + user.getName() + "!");
        response.put("accessToken", jwtService.generateAccessToken(user.getId(), user.getRole()));
        response.put("refreshToken", UUID.randomUUID().toString());
        response.put("tokenType", "Bearer");
        response.put("expiresIn", jwtService.getAccessTokenExpirationSeconds());
        Map<String, Object> userMap = new java.util.HashMap<>();
        userMap.put("id", user.getId());
        userMap.put("name", user.getName());
        userMap.put("email", user.getEmail());
        userMap.put("phone", user.getPhone());
        userMap.put("role", user.getRole().name());
        userMap.put("dob", user.getDob() != null ? user.getDob().toString() : null);
        userMap.put("emailVerified", true);
        response.put("user", userMap);
        return ResponseEntity.ok(response);
    }

    /** Find user by email or phone. */
    private User findUserByTarget(String target) {
        if (target.contains("@")) {
            return userRepository.findByEmailAndDeletedAtIsNull(target.toLowerCase())
                .orElseThrow(() -> new NotFoundException("No account found with email: " + target));
        }
        return userRepository.findByPhoneAndDeletedAtIsNull(target)
            .orElseThrow(() -> new NotFoundException("No account found with phone: " + target));
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
