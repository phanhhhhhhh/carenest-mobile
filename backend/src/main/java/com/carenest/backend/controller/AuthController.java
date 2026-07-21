package com.carenest.backend.controller;

import com.carenest.backend.dto.auth.*;
import com.carenest.backend.entity.User;
import com.carenest.backend.repository.UserRepository;
import com.carenest.backend.service.AuthService;
import com.carenest.backend.service.OtpService;
import com.carenest.backend.exception.NotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final OtpService otpService;
    private final UserRepository userRepository;


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


    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        return ResponseEntity.ok(authService.refresh(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal Long userId) {
        authService.logout(userId);
        return ResponseEntity.noContent().build();
    }


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


    @PostMapping("/send-otp")
    public ResponseEntity<Map<String, String>> sendOtp(
        @Valid @RequestBody SendOtpRequest request
    ) {
        String target = request.getTarget().trim();
        String genericMessage = "If this account exists, an OTP has been sent";

        User user = findUserByTargetOrNull(target);
        if (user == null || user.isEmailVerified()) {
            return ResponseEntity.ok(Map.of("message", genericMessage));
        }

        if ("SMS".equalsIgnoreCase(request.getMethod())) {
            otpService.sendOtpViaSms(target, user.getName());
        } else {
            otpService.sendOtpViaEmail(target, user.getName());
        }

        return ResponseEntity.ok(Map.of("message", genericMessage));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, Object>> verifyOtp(
        @Valid @RequestBody VerifyOtpRequest request,
        HttpServletRequest httpRequest
    ) {
        String target = request.getTarget().trim();
        boolean valid = otpService.verifyOtp(target, request.getCode());

        if (!valid) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Invalid or expired verification code"));
        }

        User user = findUserByTarget(target);
        user.setEmailVerified(true);
        user.setEmailVerificationToken(null);
        user.setEmailVerificationExpiry(null);
        userRepository.save(user);

        // Issue tokens through AuthService so the refresh token hash is
        // persisted -- the previous ad-hoc UUID was never stored and broke
        // the /auth/refresh flow for OTP-registered users.
        AuthResponse auth = authService.issueTokensForVerifiedUser(
            user, httpRequest.getHeader("User-Agent"));

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Verification successful! Welcome to CareNest, " + user.getName() + "!");
        response.put("accessToken", auth.getAccessToken());
        response.put("refreshToken", auth.getRefreshToken());
        response.put("tokenType", auth.getTokenType());
        response.put("expiresIn", auth.getExpiresIn());
        response.put("user", auth.getUser());
        return ResponseEntity.ok(response);
    }


    private User findUserByTarget(String target) {
        if (target.contains("@")) {
            return userRepository.findByEmailAndDeletedAtIsNull(target.toLowerCase())
                .orElseThrow(() -> new NotFoundException("No account found with email: " + target));
        }
        return userRepository.findByPhoneAndDeletedAtIsNull(target)
            .orElseThrow(() -> new NotFoundException("No account found with phone: " + target));
    }

    private User findUserByTargetOrNull(String target) {
        if (target.contains("@")) {
            return userRepository.findByEmailAndDeletedAtIsNull(target.toLowerCase()).orElse(null);
        }
        return userRepository.findByPhoneAndDeletedAtIsNull(target).orElse(null);
    }


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
