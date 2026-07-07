package com.carenest.backend.service;

import com.carenest.backend.dto.auth.AuthResponse;
import com.carenest.backend.dto.auth.ChangePasswordRequest;
import com.carenest.backend.dto.auth.LoginRequest;
import com.carenest.backend.dto.auth.RefreshRequest;
import com.carenest.backend.dto.auth.RegisterRequest;
import com.carenest.backend.entity.RefreshToken;
import com.carenest.backend.entity.User;
import com.carenest.backend.exception.ConflictException;
import com.carenest.backend.exception.NotFoundException;
import com.carenest.backend.exception.UnauthorizedException;
import com.carenest.backend.repository.RefreshTokenRepository;
import com.carenest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final FirebaseService firebaseService;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Value("${jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationMs;

    // ── Register (Email + Password) ──────────────────────────────────────────

    @Transactional
    public AuthResponse register(RegisterRequest request, String deviceInfo) {
        // Validate password match
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Password and confirm password do not match");
        }

        // Validate role
        if (request.getRole() == com.carenest.backend.entity.UserRole.ADMIN) {
            throw new UnauthorizedException("Cannot self-register ADMIN role");
        }

        // Check email uniqueness
        if (userRepository.existsByEmailAndDeletedAtIsNull(request.getEmail().toLowerCase().trim())) {
            throw new ConflictException("Email already registered: " + request.getEmail());
        }

        // Check phone uniqueness if provided
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            if (userRepository.existsByPhoneAndDeletedAtIsNull(request.getPhone())) {
                throw new ConflictException("Phone number already registered: " + request.getPhone());
            }
        }

        // Generate verification token (24h expiry)
        String verificationToken = generateSecureToken();
        OffsetDateTime expiry = OffsetDateTime.now().plusHours(24);

        User user = User.builder()
            .email(request.getEmail().toLowerCase().trim())
            .passwordHash(passwordEncoder.encode(request.getPassword()))
            .name(request.getName().trim())
            .role(request.getRole())
            .phone(request.getPhone() != null ? request.getPhone().trim() : null)
            .dob(request.getDob())
            .emailVerified(false)
            .emailVerificationToken(verificationToken)
            .emailVerificationExpiry(expiry)
            .build();
        userRepository.save(user);

        // Send verification email (async)
        emailService.sendVerificationEmail(user.getEmail(), user.getName(), verificationToken);

        return buildAuthResponse(user, deviceInfo);
    }

    // ── Login (Email + Password OR Firebase Token) ──────────────────────────

    @Transactional
    public AuthResponse login(LoginRequest request, String deviceInfo) {
        // Method 1: Email + Password
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            return loginWithEmail(request, deviceInfo);
        }

        // Method 2: Firebase phone token (legacy)
        if (request.getFirebaseToken() != null && !request.getFirebaseToken().isBlank()) {
            return loginWithFirebase(request.getFirebaseToken(), deviceInfo);
        }

        throw new IllegalArgumentException("Either email+password or firebaseToken is required");
    }

    private AuthResponse loginWithEmail(LoginRequest request, String deviceInfo) {
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new IllegalArgumentException("Password is required for email login");
        }

        User user = userRepository.findByEmailAndDeletedAtIsNull(request.getEmail().toLowerCase().trim())
            .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        if (!user.isEmailVerified()) {
            throw new UnauthorizedException(
                "Email not verified. Please check your inbox or request a new verification email.");
        }

        return buildAuthResponse(user, deviceInfo);
    }

    private AuthResponse loginWithFirebase(String firebaseToken, String deviceInfo) {
        String phone = firebaseService.verifyAndGetPhone(firebaseToken);
        User user = userRepository.findByPhoneAndDeletedAtIsNull(phone)
            .orElseThrow(() -> new NotFoundException("Phone number not registered: " + phone));
        return buildAuthResponse(user, deviceInfo);
    }

    // ── Email Verification ──────────────────────────────────────────────────

    @Transactional
    public void verifyEmail(String token) {
        User user = userRepository.findByEmailVerificationToken(token)
            .orElseThrow(() -> new UnauthorizedException("Invalid or expired verification token"));

        if (user.isEmailVerified()) {
            return; // Already verified — idempotent
        }

        if (user.getEmailVerificationExpiry() != null
            && user.getEmailVerificationExpiry().isBefore(OffsetDateTime.now())) {
            throw new UnauthorizedException(
                "Verification token has expired. Please request a new verification email.");
        }

        user.setEmailVerified(true);
        user.setEmailVerificationToken(null);
        user.setEmailVerificationExpiry(null);
        userRepository.save(user);

        emailService.sendWelcomeEmail(user.getEmail(), user.getName());
    }

    @Transactional
    public void resendVerificationEmail(String email) {
        User user = userRepository.findByEmailAndDeletedAtIsNull(email.toLowerCase().trim())
            .orElseThrow(() -> new NotFoundException("No account found with email: " + email));

        if (user.isEmailVerified()) {
            throw new ConflictException("Email is already verified. Please log in.");
        }

        // Generate new token
        String newToken = generateSecureToken();
        user.setEmailVerificationToken(newToken);
        user.setEmailVerificationExpiry(OffsetDateTime.now().plusHours(24));
        userRepository.save(user);

        emailService.sendVerificationEmail(user.getEmail(), user.getName(), newToken);
    }

    // ── Token Refresh ───────────────────────────────────────────────────────

    @Transactional
    public AuthResponse refresh(RefreshRequest request) {
        String tokenHash = sha256(request.getRefreshToken());

        RefreshToken stored = refreshTokenRepository
            .findByTokenHashAndRevokedAtIsNull(tokenHash)
            .orElseThrow(() -> new UnauthorizedException("Refresh token is invalid or has expired"));

        if (stored.getExpiresAt().isBefore(OffsetDateTime.now())) {
            stored.setRevokedAt(OffsetDateTime.now());
            refreshTokenRepository.save(stored);
            throw new UnauthorizedException("Refresh token expired, please log in again");
        }

        User user = stored.getUser();
        stored.setRevokedAt(OffsetDateTime.now());
        refreshTokenRepository.save(stored);

        return buildAuthResponse(user, stored.getDeviceInfo());
    }

    // ── Logout ──────────────────────────────────────────────────────────────

    @Transactional
    public void logout(Long userId) {
        refreshTokenRepository.findAllByUserIdAndRevokedAtIsNull(userId)
            .forEach(token -> token.setRevokedAt(OffsetDateTime.now()));
    }

    // ── Change Password ─────────────────────────────────────────────────────

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("New password and confirm password do not match");
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("User not found"));

        if (user.getPasswordHash() == null) {
            throw new UnauthorizedException(
                "No password set. Use forgot-password to set a password, or continue with phone login.");
        }

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Revoke all other sessions
        refreshTokenRepository.findAllByUserIdAndRevokedAtIsNull(userId)
            .forEach(token -> token.setRevokedAt(OffsetDateTime.now()));
    }

    // ── Forgot Password Flow ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public void forgotPassword(String email) {
        User user = userRepository.findByEmailAndDeletedAtIsNull(email.toLowerCase().trim())
            .orElseThrow(() -> new NotFoundException("No account found with email: " + email));

        // Generate password reset token (JWT, 15 min expiry)
        String resetToken = jwtService.generatePasswordResetToken(user.getId(), user.getEmail());

        emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), resetToken);
    }

    @Transactional
    public void resetPassword(String token, String newPassword, String confirmPassword) {
        if (!newPassword.equals(confirmPassword)) {
            throw new IllegalArgumentException("New password and confirm password do not match");
        }

        // Validate reset token
        if (!jwtService.validateToken(token)) {
            throw new UnauthorizedException("Invalid or expired reset token");
        }

        Long userId = jwtService.getUserIdFromToken(token);
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("User not found"));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Revoke all sessions
        refreshTokenRepository.findAllByUserIdAndRevokedAtIsNull(userId)
            .forEach(t -> t.setRevokedAt(OffsetDateTime.now()));
    }

    // ── PIN Setup ───────────────────────────────────────────────────────────

    @Transactional
    public void setupPin(Long userId, String pin, String confirmPin) {
        if (!pin.equals(confirmPin)) {
            throw new IllegalArgumentException("PIN and confirm PIN do not match");
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("User not found"));

        user.setPin(passwordEncoder.encode(pin));
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public boolean verifyPin(Long userId, String pin) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("User not found"));

        if (user.getPin() == null) {
            throw new UnauthorizedException("No PIN set. Please set up a PIN first.");
        }

        return passwordEncoder.matches(pin, user.getPin());
    }

    // ── Internal ────────────────────────────────────────────────────────────

    private AuthResponse buildAuthResponse(User user, String deviceInfo) {
        String rawRefreshToken = UUID.randomUUID().toString();

        RefreshToken refreshToken = RefreshToken.builder()
            .user(user)
            .tokenHash(sha256(rawRefreshToken))
            .deviceInfo(deviceInfo)
            .expiresAt(OffsetDateTime.now().plusSeconds(refreshTokenExpirationMs / 1000))
            .build();
        refreshTokenRepository.save(refreshToken);

        String accessToken = jwtService.generateAccessToken(user.getId(), user.getRole());
        return new AuthResponse(accessToken, rawRefreshToken, jwtService.getAccessTokenExpirationSeconds(), user);
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }
}
