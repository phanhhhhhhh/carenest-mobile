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
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final FirebaseService firebaseService;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final RateLimitService rateLimitService;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Value("${jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationMs;


    @Transactional
    public Map<String, Object> register(RegisterRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Password and confirm password do not match");
        }

        if (request.getRole() == com.carenest.backend.entity.UserRole.ADMIN) {
            throw new UnauthorizedException("Cannot self-register ADMIN role");
        }

        boolean hasEmail = request.getEmail() != null && !request.getEmail().isBlank();
        boolean hasPhone = request.getPhone() != null && !request.getPhone().isBlank();
        if (!hasEmail && !hasPhone) {
            throw new IllegalArgumentException("Either email or phone number is required");
        }

        if (hasEmail) {
            if (userRepository.existsByEmailAndDeletedAtIsNull(request.getEmail().toLowerCase().trim())) {
                throw new ConflictException("Email already registered: " + request.getEmail());
            }
        }

        if (hasPhone) {
            if (userRepository.existsByPhoneAndDeletedAtIsNull(request.getPhone().trim())) {
                throw new ConflictException("Phone number already registered: " + request.getPhone());
            }
        }

        // Phone-only accounts are auto-verified (primary registration method).
        // Email accounts must click the verification link before first login.
        String verificationToken = null;
        boolean needsVerification = !hasPhone;
        if (hasEmail) {
            verificationToken = generateSecureToken();
        }

        User user = User.builder()
            .email(hasEmail ? request.getEmail().toLowerCase().trim() : null)
            .passwordHash(passwordEncoder.encode(request.getPassword()))
            .name(request.getName().trim())
            .role(request.getRole())
            .phone(hasPhone ? request.getPhone().trim() : null)
            .dob(request.getDob())
            .emailVerified(!needsVerification)
            .emailVerificationToken(verificationToken)
            .emailVerificationExpiry(hasEmail ? OffsetDateTime.now().plusHours(24) : null)
            .build();
        userRepository.save(user);

        if (hasEmail) {
            emailService.sendVerificationEmail(user.getEmail(), user.getName(), verificationToken);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("userId", user.getId());
        response.put("message", needsVerification
            ? "Registration successful. Verify your account via email to continue."
            : "Registration successful.");
        response.put("requiresVerification", needsVerification);
        return response;
    }


    @Transactional
    public AuthResponse login(LoginRequest request, String deviceInfo) {
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            return loginWithPhone(request, deviceInfo);
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            return loginWithEmail(request, deviceInfo);
        }

        if (request.getFirebaseToken() != null && !request.getFirebaseToken().isBlank()) {
            return loginWithFirebase(request.getFirebaseToken(), deviceInfo);
        }

        throw new IllegalArgumentException("Either phone+password, email+password, or firebaseToken is required");
    }

    private AuthResponse loginWithPhone(LoginRequest request, String deviceInfo) {
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new IllegalArgumentException("Password is required for phone login");
        }

        User user = userRepository.findByPhoneAndDeletedAtIsNull(request.getPhone().trim())
            .orElseThrow(() -> new UnauthorizedException("Invalid phone or password"));

        rateLimitService.checkLockout(user.getId());

        if (user.getPasswordHash() == null) {
            rateLimitService.recordFailedAttempt(user.getId());
            throw new UnauthorizedException(
                "No password set for this account. Use forgot-password to set a password, or login with Firebase OTP.");
        }

        if (!user.isEmailVerified()) {
            throw new UnauthorizedException(
                "Account not verified. Please verify your account via OTP before logging in.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            rateLimitService.recordFailedAttempt(user.getId());
            throw new UnauthorizedException("Invalid phone or password");
        }

        rateLimitService.clearFailedAttempts(user.getId());
        return buildAuthResponse(user, deviceInfo);
    }

    private AuthResponse loginWithEmail(LoginRequest request, String deviceInfo) {
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new IllegalArgumentException("Password is required for email login");
        }

        User user = userRepository.findByEmailAndDeletedAtIsNull(request.getEmail().toLowerCase().trim())
            .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        rateLimitService.checkLockout(user.getId());

        if (!user.isEmailVerified()) {
            throw new UnauthorizedException(
                "Email not verified. Please check your inbox or request a new verification email.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            rateLimitService.recordFailedAttempt(user.getId());
            throw new UnauthorizedException("Invalid email or password");
        }

        rateLimitService.clearFailedAttempts(user.getId());
        return buildAuthResponse(user, deviceInfo);
    }

    private AuthResponse loginWithFirebase(String firebaseToken, String deviceInfo) {
        String phone = firebaseService.verifyAndGetPhone(firebaseToken);
        User user = userRepository.findByPhoneAndDeletedAtIsNull(phone)
            .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));
        return buildAuthResponse(user, deviceInfo);
    }


    @Transactional
    public void verifyEmail(String token) {
        User user = userRepository.findByEmailVerificationToken(token)
            .orElseThrow(() -> new UnauthorizedException("Invalid or expired verification token"));

        if (user.isEmailVerified()) {
            return;
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

        String newToken = generateSecureToken();
        user.setEmailVerificationToken(newToken);
        user.setEmailVerificationExpiry(OffsetDateTime.now().plusHours(24));
        userRepository.save(user);

        emailService.sendVerificationEmail(user.getEmail(), user.getName(), newToken);
    }


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


    @Transactional
    public void logout(Long userId) {
        refreshTokenRepository.findAllByUserIdAndRevokedAtIsNull(userId)
            .forEach(token -> token.setRevokedAt(OffsetDateTime.now()));
    }


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

        refreshTokenRepository.findAllByUserIdAndRevokedAtIsNull(userId)
            .forEach(token -> token.setRevokedAt(OffsetDateTime.now()));
    }


    @Transactional(readOnly = true)
    public void forgotPassword(String email) {
        userRepository.findByEmailAndDeletedAtIsNull(email.toLowerCase().trim())
            .ifPresent(user -> {
                String resetToken = jwtService.generatePasswordResetToken(user.getId(), user.getEmail());
                emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), resetToken);
            });
    }

    @Transactional
    public void resetPassword(String token, String newPassword, String confirmPassword) {
        if (!newPassword.equals(confirmPassword)) {
            throw new IllegalArgumentException("New password and confirm password do not match");
        }

        if (!jwtService.validateToken(token)) {
            throw new UnauthorizedException("Invalid or expired reset token");
        }

        Long userId = jwtService.getUserIdFromToken(token);
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("User not found"));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        refreshTokenRepository.findAllByUserIdAndRevokedAtIsNull(userId)
            .forEach(t -> t.setRevokedAt(OffsetDateTime.now()));
    }


    @Transactional
    public void setupPin(Long userId, String pin, String confirmPin) {
        if (!pin.equals(confirmPin)) {
            throw new IllegalArgumentException("PIN and confirm PIN do not match");
        }

        if (pin == null || !pin.matches("\\d{4,6}")) {
            throw new IllegalArgumentException("PIN must be 4-6 digits");
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


    /**
     * Issue an access + persisted refresh token for a user that has just been
     * verified out-of-band (e.g. via SMS OTP). Same path as a normal login.
     */
    @Transactional
    public AuthResponse issueTokensForVerifiedUser(User user, String deviceInfo) {
        return buildAuthResponse(user, deviceInfo);
    }

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
