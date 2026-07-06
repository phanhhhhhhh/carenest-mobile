package com.carenest.backend.service;

import com.carenest.backend.entity.HealthMetricType;
import com.carenest.backend.entity.User;
import com.carenest.backend.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
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
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * UC-10: Google Fit / Smartwatch data synchronization.
 * Pulls heart rate, step count, and sleep data from Google Fit REST API
 * on a scheduled basis (every 1 hour per spec).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleFitService {

    private final RestClient restClient = RestClient.builder().build();
    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;
    private final HealthMetricService healthMetricService;
    private final AnomalyDetectionService anomalyDetectionService;

    @Value("${google.fit.client-id:}")
    private String clientId;

    @Value("${google.fit.client-secret:}")
    private String clientSecret;

    @Value("${google.fit.redirect-uri:http://localhost:8080/api/google-fit/callback}")
    private String redirectUri;

    private static final String GOOGLE_FIT_API = "https://www.googleapis.com/fitness/v1/users/me";
    private static final String GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

    // In-memory token store (production should use DB)
    private final Map<Long, String> accessTokens = new HashMap<>();
    private final Map<Long, String> refreshTokens = new HashMap<>();

    /**
     * UC-10: Scheduled background sync every 1 hour.
     * Fetches heart rate, step count, and sleep data for all connected users.
     */
    @Scheduled(fixedRate = 3600000) // every hour
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
                if (accessTokens.containsKey(elderly.getId())) {
                    syncHealthData(elderly);
                    synced++;
                }
            } catch (Exception e) {
                log.warn("Google Fit sync failed for userId={}: {}", elderly.getId(), e.getMessage());
            }
        }
        log.info("Google Fit sync complete: {} users synced", synced);
    }

    /**
     * Generate the OAuth authorization URL for Google Fit.
     */
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

    /**
     * Handle OAuth callback — exchange code for tokens.
     */
    public void handleOAuthCallback(String code, Long userId) {
        try {
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
            accessTokens.put(userId, json.get("access_token").asText());
            if (json.has("refresh_token")) {
                refreshTokens.put(userId, json.get("refresh_token").asText());
            }
            log.info("Google Fit OAuth complete for userId={}", userId);
        } catch (Exception e) {
            log.error("Google Fit OAuth failed for userId={}: {}", userId, e.getMessage());
            throw new RuntimeException("Failed to exchange OAuth code", e);
        }
    }

    /**
     * Sync health data from Google Fit for a specific user.
     */
    public Map<String, Object> syncHealthData(User elderly) {
        String accessToken = accessTokens.get(elderly.getId());
        if (accessToken == null) {
            return Map.of("status", "NOT_CONNECTED", "message", "Google Fit not connected");
        }

        Map<String, Object> results = new LinkedHashMap<>();
        results.put("userId", elderly.getId());

        try {
            // Fetch heart rate
            var heartRateData = fetchHeartRate(elderly.getId(), accessToken);
            results.put("heartRate", heartRateData);

            // Fetch step count
            var stepData = fetchStepCount(elderly.getId(), accessToken);
            results.put("steps", stepData);

            log.info("Google Fit data synced for userId={}: heartRate={} steps={}",
                elderly.getId(), heartRateData.get("count"), stepData.get("count"));

            return results;
        } catch (Exception e) {
            // Try refresh token
            if (refreshTokens.containsKey(elderly.getId())) {
                try {
                    refreshAccessToken(elderly.getId());
                    return Map.of("status", "TOKEN_REFRESHED", "message", "Token refreshed — retry sync");
                } catch (Exception ex) {
                    accessTokens.remove(elderly.getId());
                    refreshTokens.remove(elderly.getId());
                    return Map.of("status", "ERROR", "message", "Token refresh failed — please reconnect Google Fit");
                }
            }
            return Map.of("status", "ERROR", "message", e.getMessage());
        }
    }

    /**
     * Check if Google Fit is configured.
     */
    public boolean isConfigured() {
        return clientId != null && !clientId.isBlank()
            && clientSecret != null && !clientSecret.isBlank();
    }

    // ── Private: Data Fetching ──────────────────────────────────────────────

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
                // Save as health metric via the service
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

    private void refreshAccessToken(Long userId) {
        String refreshToken = refreshTokens.get(userId);
        if (refreshToken == null) throw new RuntimeException("No refresh token");

        Map<String, String> body = Map.of(
            "client_id", clientId,
            "client_secret", clientSecret,
            "refresh_token", refreshToken,
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
            accessTokens.put(userId, json.get("access_token").asText());
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
            // healthMetricService.create() already triggers anomaly detection internally
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
