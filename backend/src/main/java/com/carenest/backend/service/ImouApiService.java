package com.carenest.backend.service;

import com.carenest.backend.config.ImouProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class ImouApiService {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final ImouProperties properties;

    public ImouApiService(ObjectMapper objectMapper, ImouProperties properties) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(properties.getConnectionTimeout());
        requestFactory.setReadTimeout(properties.getReadTimeout());
        this.restClient = RestClient.builder()
            .baseUrl(properties.getBaseUrl())
            .requestFactory(requestFactory)
            .build();
        this.objectMapper = objectMapper;
        this.properties = properties;
    }

    public boolean isConfigured() {
        return properties.isEnabled();
    }

    public Map<String, Object> bindDevice(String deviceSn, String accessToken) {
        Map<String, Object> params = Map.of("deviceId", deviceSn);
        return callImouApi("bindDevice", params, accessToken);
    }

    public Map<String, Object> unbindDevice(String deviceSn, String accessToken) {
        Map<String, Object> params = Map.of("deviceId", deviceSn);
        return callImouApi("unBindDevice", params, accessToken);
    }

    public Map<String, Object> getLiveStreamUrl(String deviceSn, String accessToken) {
        Map<String, Object> params = Map.of(
            "deviceId", deviceSn,
            "channelId", "0",
            "streamType", "0"
        );
        return callImouApi("getLiveStreamInfo", params, accessToken);
    }

    public Map<String, Object> captureSnapshot(String deviceSn, String accessToken) {
        Map<String, Object> params = Map.of(
            "deviceId", deviceSn,
            "channelId", "0"
        );
        return callImouApi("captureCameraSnapshot", params, accessToken);
    }

    public Map<String, Object> startTwoWayAudio(String deviceSn, String accessToken) {
        Map<String, Object> params = Map.of(
            "deviceId", deviceSn,
            "channelId", "0"
        );
        return callImouApi("startTwoWayAudio", params, accessToken);
    }

    public Map<String, Object> stopTwoWayAudio(String deviceSn, String accessToken) {
        Map<String, Object> params = Map.of(
            "deviceId", deviceSn,
            "channelId", "0"
        );
        return callImouApi("stopTwoWayAudio", params, accessToken);
    }

    public Map<String, Object> setPrivacyMode(String deviceSn, boolean enabled, String accessToken) {
        Map<String, Object> params = Map.of(
            "deviceId", deviceSn,
            "enable", enabled ? "1" : "0"
        );
        return callImouApi("setPrivacyMode", params, accessToken);
    }

    public Map<String, Object> getDeviceStatus(String deviceSn, String accessToken) {
        Map<String, Object> params = Map.of("deviceId", deviceSn);
        return callImouApi("getDeviceStatus", params, accessToken);
    }

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

    public Map<String, Object> controlPtz(String deviceSn, String direction, String accessToken) {
        Map<String, Object> params = Map.of(
            "deviceId", deviceSn,
            "channelId", "0",
            "operation", direction.toUpperCase(),
            "duration", "1000"
        );
        return callImouApi("ptzControl", params, accessToken);
    }

    public String getAccessToken() {
        if (!isConfigured()) {
            log.warn("Imou API not configured");
            return null;
        }
        Map<String, Object> params = Map.of(
            "appId", properties.getAppId(),
            "appSecret", properties.getAppSecret()
        );
        Map<String, Object> result = callImouApi("getAccessToken", params, null);
        return result != null ? (String) result.get("accessToken") : null;
    }

    private Map<String, Object> callImouApi(String method, Map<String, Object> params, String accessToken) {
        if (!isConfigured()) {
            log.debug("Imou API not configured — skipping {}", method);
            return Map.of("error", "Imou API not configured");
        }

        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("id", UUID.randomUUID().toString());
            body.put("system", Map.of("ver", "1.0", "appId", properties.getAppId()));
            body.put("method", method);
            body.put("params", params);
            if (accessToken != null) {
                body.put("accessToken", accessToken);
            }

            String response = restClient.post()
                .uri("/openapi/device")
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
