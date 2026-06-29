package com.carenest.backend.service;

import com.carenest.backend.entity.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
@Slf4j
public class JwtService {

    private static final String DEFAULT_WEAK_SECRET = "dev-secret-key-for-local-dev-only-min-32-chars";

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.access-token-expiration-ms}")
    private long accessTokenExpirationMs;

    @Autowired
    private Environment environment;

    @PostConstruct
    public void init() {
        boolean isWeak = DEFAULT_WEAK_SECRET.equals(secret) || secret.length() < 32;
        if (isWeak) {
            boolean isSafeProfile = environment.matchesProfiles("local") || environment.matchesProfiles("dev");
            if (!isSafeProfile) {
                throw new IllegalStateException(
                    "JWT secret quá yếu hoặc dùng default — set JWT_SECRET env var trước khi deploy"
                );
            }
            log.warn("JWT secret is weak or default — acceptable only in local/dev profile. Set JWT_SECRET before deploying.");
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