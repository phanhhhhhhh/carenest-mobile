package com.carenest.backend.service;

import com.carenest.backend.dto.auth.AuthResponse;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final FirebaseService firebaseService;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationMs;

    @Transactional
    public AuthResponse register(RegisterRequest request, String deviceInfo) {
        String phone = firebaseService.verifyAndGetPhone(request.getFirebaseToken());

        if (request.getRole() == com.carenest.backend.entity.UserRole.ADMIN) {
            throw new UnauthorizedException("Không thể tự đăng ký role ADMIN");
        }

        if (userRepository.existsByPhoneAndDeletedAtIsNull(phone)) {
            throw new ConflictException("Số điện thoại đã được đăng ký: " + phone);
        }

        User user = User.builder()
            .phone(phone)
            .name(request.getName())
            .role(request.getRole())
            .dob(request.getDob())
            .build();
        userRepository.save(user);

        return buildAuthResponse(user, deviceInfo);
    }

    @Transactional
    public AuthResponse login(LoginRequest request, String deviceInfo) {
        String phone = firebaseService.verifyAndGetPhone(request.getFirebaseToken());

        User user = userRepository.findByPhoneAndDeletedAtIsNull(phone)
            .orElseThrow(() -> new NotFoundException("Số điện thoại chưa đăng ký: " + phone));

        return buildAuthResponse(user, deviceInfo);
    }

    @Transactional
    public AuthResponse refresh(RefreshRequest request) {
        String tokenHash = sha256(request.getRefreshToken());

        RefreshToken stored = refreshTokenRepository
            .findByTokenHashAndRevokedAtIsNull(tokenHash)
            .orElseThrow(() -> new UnauthorizedException("Refresh token không hợp lệ hoặc đã hết hạn"));

        if (stored.getExpiresAt().isBefore(OffsetDateTime.now())) {
            stored.setRevokedAt(OffsetDateTime.now());
            refreshTokenRepository.save(stored);
            throw new UnauthorizedException("Refresh token đã hết hạn, vui lòng đăng nhập lại");
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