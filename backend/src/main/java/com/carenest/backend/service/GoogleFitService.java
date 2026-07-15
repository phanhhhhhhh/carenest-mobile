package com.carenest.backend.service;

import com.carenest.backend.entity.GoogleFitToken;
import com.carenest.backend.entity.HealthMetricType;
import com.carenest.backend.entity.User;
import com.carenest.backend.repository.GoogleFitTokenRepository;
import com.carenest.backend.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.*;


@Slf4j
@Service
public class GoogleFitService {

    private final RestClient restClient = RestClient.builder().build();
    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;
    private final HealthMetricService healthMetricService;
    private final GoogleFitTokenRepository googleFitTokenRepository;

    @Value("${google.fit.client-id:}")
    private String clientId;

    @Value("${google.fit.client-secret:}")
    private String clientSecret;

    @Value("${google.fit.redirect-uri:http://localhost:8080/api/google-fit/callback}")
    private String redirectUri;

    private static final String GOOGLE_FIT_API = "https://www.googleapis.com/fitness/v1/users/me";
    private static final String GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

    public GoogleFitService(ObjectMapper objectMapper,
                            UserRepository userRepository,
                            HealthMetricService healthMetricService,
                            GoogleFitTokenRepository googleFitTokenRepository) {
        this.objectMapper = objectMapper;
        this.userRepository = userRepository;
        this.healthMetricService = healthMetricService;
        this.googleFitTokenRepository = googleFitTokenRepository;
    }

    
    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void scheduledSync() {
        if (!isConfigured()) {
            log.debug("Google Fit not configured — skipping scheduled sync");
            return;
        }

        log.info("Starting Google Fit scheduled sync...");
        int synced = 0;
        List<User> elderlyUsers = userRepository.findAll()
            .stream()
            .filter(u -> u.getDeletedAt() == null
                && u.getRole() == com.carenest.backend.entity.UserRole.ELDERLY)
            .toList();

        for (User elderly : elderlyUsers) {
            try {
                if (isConnected(elderly.getId())) {
                    syncHealthData(elderly);
                    synced++;
                }
            } catch (Exception e) {
                log.warn("Google Fit sync failed for userId={}: {}", elderly.getId(), e.getMessage());
            }
        }
        log.info("Google Fit sync complete: {} users synced", synced);
    }

    
    public String getAuthorizationUrl(Long userId) {
        if (!isConfigured()) {
            throw new IllegalStateException("Google Fit is not configured");
        }
        String state = userId + ":" + UUID.randomUUID();
        return "https://accounts.google.com/o/oauth2/v2/auth"
            + "?client_id=" + clientId
            + "&redirect_uri=" + redirectUri
            + "&response_type=code"
            + "&scope=" + String.join(" ", List.of(
                "https://www.googleapis.com/auth/fitness.heart_rate.read",
                "https://www.googleapis.com/auth/fitness.activity.read",
                "https://www.googleapis.com/auth/fitness.sleep.read"
            ))
            + "&access_type=offline"
            + "&prompt=consent"
            + "&state=" + state;
    }

    
    @Transactional
    public void handleOAuthCallback(String code, Long userId) {
        try {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

            Map<String, String> body = Map.of(
                "client_id", clientId,
                "client_secret", clientSecret,
                "code", code,
                "grant_type", "authorization_code",
                "redirect_uri", redirectUri
            );

            String response = restClient.post()
                .uri(GOOGLE_TOKEN_URL)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(buildFormBody(body))
                .retrieve()
                .body(String.class);

            JsonNode json = objectMapper.readTree(response);
            String accessToken = json.get("access_token").asText();
            String refreshToken = json.has("refresh_token") ? json.get("refresh_token").asText() : null;
            long expiresIn = json.has("expires_in") ? json.get("expires_in").asLong() : 3600;

            GoogleFitToken token = googleFitTokenRepository.findByUserId(userId)
                .orElse(GoogleFitToken.builder().user(user).build());

            token.setAccessToken(accessToken);
            if (refreshToken != null) {
                token.setRefreshToken(refreshToken);
            }
            token.setExpiresAt(Instant.now().plusSeconds(expiresIn));
            googleFitTokenRepository.save(token);

            log.info("Google Fit OAuth complete for userId={}", userId);
        } catch (Exception e) {
            log.error("Google Fit OAuth failed for userId={}: {}", userId, e.getMessage());
            throw new RuntimeException("Failed to exchange OAuth code", e);
        }
    }

    
    @Transactional
    public Map<String, Object> syncHealthData(User elderly) {
        GoogleFitToken token = googleFitTokenRepository.findByUserId(elderly.getId()).orElse(null);
        if (token == null || token.getAccessToken() == null) {
            return Map.of("status", "NOT_CONNECTED", "message", "Google Fit not connected");
        }

        Map<String, Object> results = new LinkedHashMap<>();
        results.put("userId", elderly.getId());

        try {
            var heartRateData = fetchHeartRate(elderly.getId(), token.getAccessToken());
            results.put("heartRate", heartRateData);

            var stepData = fetchStepCount(elderly.getId(), token.getAccessToken());
            results.put("steps", stepData);

            log.info("Google Fit data synced for userId={}: heartRate={} steps={}",
                elderly.getId(), heartRateData.get("count"), stepData.get("count"));

            return results;
        } catch (Exception e) {
            if (token.getRefreshToken() != null) {
                try {
                    refreshAccessToken(elderly.getId(), token);
                    return Map.of("status", "TOKEN_REFRESHED", "message", "Token refreshed — retry sync");
                } catch (Exception ex) {
                    googleFitTokenRepository.deleteByUserId(elderly.getId());
                    return Map.of("status", "ERROR", "message", "Token refresh failed — please reconnect Google Fit");
                }
            }
            return Map.of("status", "ERROR", "message", e.getMessage());
        }
    }

    
    public boolean isConfigured() {
        return clientId != null && !clientId.isBlank()
            && clientSecret != null && !clientSecret.isBlank();
    }

    
    @Transactional(readOnly = true)
    public boolean isConnected(Long userId) {
        return googleFitTokenRepository.findByUserId(userId)
            .map(t -> t.getAccessToken() != null && !t.getAccessToken().isBlank())
            .orElse(false);
    }

    
    @Transactional
    public void disconnect(Long userId) {
        GoogleFitToken token = googleFitTokenRepository.findByUserId(userId).orElse(null);
        if (token != null && token.getAccessToken() != null) {
            try {
                restClient.post()
                    .uri("https://oauth2.googleapis.com/revoke?token=" + token.getAccessToken())
                    .retrieve()
                    .toBodilessEntity();
                log.info("Google Fit token revoked at Google for userId={}", userId);
            } catch (Exception e) {
                log.warn("Failed to revoke Google Fit token at Google for userId={}: {}", userId, e.getMessage());
            }
        }
        googleFitTokenRepository.deleteByUserId(userId);
        log.info("Google Fit disconnected for userId={}", userId);
    }


    private Map<String, Object> fetchHeartRate(Long userId, String accessToken) {
        try {
            long nowNanos = Instant.now().toEpochMilli() * 1_000_000L;
            long oneDayAgo = Instant.now().minusSeconds(86400).toEpochMilli() * 1_000_000L;

            Map<String, Object> body = Map.of(
                "aggregateBy", List.of(Map.of("dataTypeName", "com.google.heart_rate.bpm")),
                "bucketByTime", Map.of("durationMillis", 3600000),
                "startTimeMillis", oneDayAgo / 1_000_000,
                "endTimeMillis", nowNanos / 1_000_000
            );

            String response = restClient.post()
                .uri(GOOGLE_FIT_API + "/dataset:aggregate")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body(objectMapper.writeValueAsString(body))
                .retrieve()
                .body(String.class);

            JsonNode root = objectMapper.readTree(response);
            int count = 0;
            double sum = 0;
            JsonNode buckets = root.path("bucket");
            for (JsonNode bucket : buckets) {
                JsonNode datasets = bucket.path("dataset");
                for (JsonNode dataset : datasets) {
                    JsonNode points = dataset.path("point");
                    for (JsonNode point : points) {
                        JsonNode values = point.path("value");
                        for (JsonNode val : values) {
                            sum += val.path("fpVal").asDouble();
                            count++;
                        }
                    }
                }
            }

            if (count > 0) {
                double avgBpm = sum / count;
                saveMetric(userId, HealthMetricType.HEART_RATE,
                    BigDecimal.valueOf(Math.round(avgBpm)), "bpm");
            }

            return Map.of("count", count, "avgBpm", count > 0 ? Math.round(sum / count) : 0);
        } catch (Exception e) {
            log.warn("Failed to fetch heart rate: {}", e.getMessage());
            return Map.of("count", 0, "error", e.getMessage());
        }
    }

    private Map<String, Object> fetchStepCount(Long userId, String accessToken) {
        try {
            long nowNanos = Instant.now().toEpochMilli() * 1_000_000L;
            long oneDayAgo = Instant.now().minusSeconds(86400).toEpochMilli() * 1_000_000L;

            Map<String, Object> body = Map.of(
                "aggregateBy", List.of(Map.of("dataTypeName", "com.google.step_count.delta")),
                "bucketByTime", Map.of("durationMillis", 86400000),
                "startTimeMillis", oneDayAgo / 1_000_000,
                "endTimeMillis", nowNanos / 1_000_000
            );

            String response = restClient.post()
                .uri(GOOGLE_FIT_API + "/dataset:aggregate")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body(objectMapper.writeValueAsString(body))
                .retrieve()
                .body(String.class);

            JsonNode root = objectMapper.readTree(response);
            int totalSteps = 0;
            JsonNode buckets = root.path("bucket");
            for (JsonNode bucket : buckets) {
                JsonNode datasets = bucket.path("dataset");
                for (JsonNode dataset : datasets) {
                    JsonNode points = dataset.path("point");
                    for (JsonNode point : points) {
                        JsonNode values = point.path("value");
                        for (JsonNode val : values) {
                            totalSteps += val.path("intVal").asInt();
                        }
                    }
                }
            }

            return Map.of("count", 1, "totalSteps", totalSteps);
        } catch (Exception e) {
            log.warn("Failed to fetch step count: {}", e.getMessage());
            return Map.of("count", 0, "error", e.getMessage());
        }
    }

    private void refreshAccessToken(Long userId, GoogleFitToken token) {
        if (token.getRefreshToken() == null) {
            throw new RuntimeException("No refresh token available");
        }

        Map<String, String> body = Map.of(
            "client_id", clientId,
            "client_secret", clientSecret,
            "refresh_token", token.getRefreshToken(),
            "grant_type", "refresh_token"
        );

        String response = restClient.post()
            .uri(GOOGLE_TOKEN_URL)
            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
            .body(buildFormBody(body))
            .retrieve()
            .body(String.class);

        try {
            JsonNode json = objectMapper.readTree(response);
            token.setAccessToken(json.get("access_token").asText());
            if (json.has("expires_in")) {
                token.setExpiresAt(Instant.now().plusSeconds(json.get("expires_in").asLong()));
            }
            googleFitTokenRepository.save(token);
            log.info("Google Fit token refreshed for userId={}", userId);
        } catch (Exception e) {
            throw new RuntimeException("Failed to refresh token", e);
        }
    }

    private void saveMetric(Long userId, HealthMetricType type, BigDecimal value, String unit) {
        try {
            var request = com.carenest.backend.dto.health.HealthMetricRequest.builder()
                .elderlyId(userId)
                .type(type)
                .value(value)
                .unit(unit)
                .recordedAt(OffsetDateTime.now())
                .notes("Synced from Google Fit")
                .build();
            healthMetricService.create(request);
        } catch (Exception e) {
            log.warn("Failed to save Google Fit metric for userId={}: {}", userId, e.getMessage());
        }
    }

    private String buildFormBody(Map<String, String> params) {
        StringBuilder sb = new StringBuilder();
        for (var entry : params.entrySet()) {
            if (sb.length() > 0) sb.append("&");
            sb.append(java.net.URLEncoder.encode(entry.getKey(), java.nio.charset.StandardCharsets.UTF_8));
            sb.append("=");
            sb.append(java.net.URLEncoder.encode(entry.getValue(), java.nio.charset.StandardCharsets.UTF_8));
        }
        return sb.toString();
    }
}
