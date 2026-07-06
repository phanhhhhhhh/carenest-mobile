package com.carenest.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;
import java.util.UUID;

/**
 * Low-level REST client for Imou Open Platform API.
 * Handles device binding, live streaming, snapshots, and two-way audio.
 *
 * Imou API docs: https://open.imoulife.com
 */
@Slf4j
@Service
public class ImouApiService {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Value("${imou.api.base-url:https://openapi.imoulife.com}")
    private String baseUrl;

    @Value("${imou.api.app-id:}")
    private String appId;

    @Value("${imou.api.app-secret:}")
    private String appSecret;

    public ImouApiService(ObjectMapper objectMapper) {
        this.restClient = RestClient.builder().build();
        this.objectMapper = objectMapper;
    }

    public boolean isConfigured() {
        return appId != null && !appId.isBlank()
            && appSecret != null && !appSecret.isBlank();
    }

    /**
     * UC-26: Bind a camera device to the application account.
     */
    public Map<String, Object> bindDevice(String deviceSn, String accessToken) {
        Map<String, Object> params = Map.of("deviceId", deviceSn);
        return callImouApi("bindDevice", params, accessToken);
    }

    /**
     * UC-26: Unbind a camera device.
     */
    public Map<String, Object> unbindDevice(String deviceSn, String accessToken) {
        Map<String, Object> params = Map.of("deviceId", deviceSn);
        return callImouApi("unBindDevice", params, accessToken);
    }

    /**
     * UC-27: Get live stream URL for a camera.
     */
    public Map<String, Object> getLiveStreamUrl(String deviceSn, String accessToken) {
        Map<String, Object> params = Map.of(
            "deviceId", deviceSn,
            "channelId", "0",
            "streamType", "0"  // 0=main stream, 1=sub stream
        );
        return callImouApi("getLiveStreamInfo", params, accessToken);
    }

    /**
     * UC-28: Capture a snapshot from the camera.
     */
    public Map<String, Object> captureSnapshot(String deviceSn, String accessToken) {
        Map<String, Object> params = Map.of(
            "deviceId", deviceSn,
            "channelId", "0"
        );
        return callImouApi("captureCameraSnapshot", params, accessToken);
    }

    /**
     * UC-31: Open two-way audio channel.
     */
    public Map<String, Object> startTwoWayAudio(String deviceSn, String accessToken) {
        Map<String, Object> params = Map.of(
            "deviceId", deviceSn,
            "channelId", "0"
        );
        return callImouApi("startTwoWayAudio", params, accessToken);
    }

    /**
     * UC-31: Close two-way audio channel.
     */
    public Map<String, Object> stopTwoWayAudio(String deviceSn, String accessToken) {
        Map<String, Object> params = Map.of(
            "deviceId", deviceSn,
            "channelId", "0"
        );
        return callImouApi("stopTwoWayAudio", params, accessToken);
    }

    /**
     * UC-32: Set privacy mode (disable video streaming).
     */
    public Map<String, Object> setPrivacyMode(String deviceSn, boolean enabled, String accessToken) {
        Map<String, Object> params = Map.of(
            "deviceId", deviceSn,
            "enable", enabled ? "1" : "0"
        );
        return callImouApi("setPrivacyMode", params, accessToken);
    }

    /**
     * UC-33: Get device connection status.
     */
    public Map<String, Object> getDeviceStatus(String deviceSn, String accessToken) {
        Map<String, Object> params = Map.of("deviceId", deviceSn);
        return callImouApi("getDeviceStatus", params, accessToken);
    }

    /**
     * UC-30: Query motion detection events.
     */
    public Map<String, Object> getMotionEvents(String deviceSn, String beginTime, String endTime, String accessToken) {
        Map<String, Object> params = Map.of(
            "deviceId", deviceSn,
            "channelId", "0",
            "beginTime", beginTime,
            "endTime", endTime,
            "limit", "50"
        );
        return callImouApi("getMotionDetectEvents", params, accessToken);
    }

    /**
     * Get an access token for API calls.
     */
    public String getAccessToken() {
        if (!isConfigured()) {
            log.warn("Imou API not configured");
            return null;
        }
        Map<String, Object> params = Map.of("appId", appId, "appSecret", appSecret);
        Map<String, Object> result = callImouApi("getAccessToken", params, null);
        return result != null ? (String) result.get("accessToken") : null;
    }

    // ── Private ──────────────────────────────────────────────────────────────

    private Map<String, Object> callImouApi(String method, Map<String, Object> params, String accessToken) {
        if (!isConfigured()) {
            log.debug("Imou API not configured — skipping {}", method);
            return Map.of("error", "Imou API not configured");
        }

        try {
            Map<String, Object> body = new java.util.LinkedHashMap<>();
            body.put("id", UUID.randomUUID().toString());
            body.put("system", Map.of("ver", "1.0", "appId", appId));
            body.put("method", method);
            body.put("params", params);
            if (accessToken != null) {
                body.put("accessToken", accessToken);
            }

            String response = restClient.post()
                .uri(baseUrl + "/openapi/device")
                .header("Content-Type", "application/json")
                .body(objectMapper.writeValueAsString(body))
                .retrieve()
                .body(String.class);

            JsonNode json = objectMapper.readTree(response);
            String code = json.path("result").path("code").asText();
            if (!"0".equals(code) && !"ok".equalsIgnoreCase(code)) {
                String msg = json.path("result").path("msg").asText("Unknown error");
                log.warn("Imou API {} failed: code={} msg={}", method, code, msg);
                return Map.of("error", msg, "code", code);
            }

            // Return result data
            JsonNode data = json.path("result").path("data");
            if (data.isMissingNode()) {
                return Map.of("success", true);
            }
            @SuppressWarnings("unchecked")
            Map<String, Object> resultMap = objectMapper.convertValue(data, Map.class);
            return resultMap;
        } catch (Exception e) {
            log.error("Imou API {} call failed: {}", method, e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }
}
