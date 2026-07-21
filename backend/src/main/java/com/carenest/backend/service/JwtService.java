package com.carenest.backend.service;

import com.carenest.backend.entity.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
@Slf4j
public class JwtService {

    private static final int MIN_SECRET_LENGTH = 32;

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.access-token-expiration-ms}")
    private long accessTokenExpirationMs;

    @PostConstruct
    public void init() {
        if (secret == null || secret.isBlank() || secret.length() < MIN_SECRET_LENGTH) {
            throw new IllegalStateException(
                    "JWT_SECRET is missing or too weak (must be at least " + MIN_SECRET_LENGTH
                            + " characters) — set the JWT_SECRET env var before starting the app");
        }
    }

    public String generateAccessToken(Long userId, UserRole role) {
        return Jwts.builder()
                .subject(userId.toString())
                .claim("role", role.name())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessTokenExpirationMs))
                .signWith(signingKey())
                .compact();
    }

    
    public String generatePasswordResetToken(Long userId, String email) {
        long resetExpirationMs = 15 * 60 * 1000;
        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .claim("purpose", "password_reset")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + resetExpirationMs))
                .signWith(signingKey())
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(signingKey()).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("JWT validation failed: {}", e.getMessage());
            return false;
        }
    }

    public Long getUserIdFromToken(String token) {
        return Long.parseLong(parseClaims(token).getSubject());
    }

    public UserRole getRoleFromToken(String token) {
        return UserRole.valueOf(parseClaims(token).get("role", String.class));
    }

    public long getAccessTokenExpirationSeconds() {
        return accessTokenExpirationMs / 1000;
    }

    private Claims parseClaims(String token) {
        return Jwts.parser().verifyWith(signingKey()).build()
                .parseSignedClaims(token).getPayload();
    }

    private SecretKey signingKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }
}