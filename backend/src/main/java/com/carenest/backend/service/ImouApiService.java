package com.carenest.backend.service;

import com.carenest.backend.config.ImouProperties;
import com.carenest.backend.dto.camera.ImouModels;
import com.carenest.backend.exception.ImouApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Clock;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Supplier;

@Slf4j
@Service
public class ImouApiService {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final ImouProperties properties;
    private final ImouRequestSigner signer;
    private final Clock clock;
    private final Supplier<UUID> uuidSupplier;

    @org.springframework.beans.factory.annotation.Autowired
    public ImouApiService(
        ObjectMapper objectMapper,
        ImouProperties properties,
        ImouRequestSigner signer
    ) {
        this(objectMapper, properties, signer, Clock.systemUTC(), UUID::randomUUID);
    }

    ImouApiService(
        ObjectMapper objectMapper,
        ImouProperties properties,
        ImouRequestSigner signer,
        Clock clock,
        Supplier<UUID> uuidSupplier
    ) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(properties.getConnectionTimeout());
        requestFactory.setReadTimeout(properties.getReadTimeout());
        this.restClient = RestClient.builder()
            .baseUrl(properties.getBaseUrl())
            .requestFactory(requestFactory)
            .build();
        this.objectMapper = objectMapper;
        this.properties = properties;
        this.signer = signer;
        this.clock = clock;
        this.uuidSupplier = uuidSupplier;
    }

    public boolean isConfigured() {
        return properties.isEnabled();
    }

    public ImouModels.BindingState checkDeviceBinding(String deviceSn, String accessToken) {
        return callImouApi(
            "checkDeviceBindOrNot",
            new ImouModels.DeviceParams(accessToken, deviceSn),
            ImouModels.BindingState.class);
    }

    public void bindDevice(String deviceSn, String verificationCode, String accessToken) {
        callImouApi(
            "bindDevice",
            new ImouModels.BindDeviceParams(accessToken, deviceSn, verificationCode),
            Void.class);
    }

    public Map<String, Object> bindDevice(String deviceSn, String accessToken) {
        bindDevice(deviceSn, "", accessToken);
        return Map.of("deviceId", deviceSn);
    }

    public ImouModels.DeviceOnlineData deviceOnline(String deviceSn, String accessToken) {
        return callImouApi(
            "deviceOnline",
            new ImouModels.DeviceParams(accessToken, deviceSn),
            ImouModels.DeviceOnlineData.class);
    }

    public ImouModels.DeviceAbilityData listDeviceAbility(String deviceSn, String accessToken) {
        ImouModels.AbilityDeviceRequest device =
            new ImouModels.AbilityDeviceRequest(deviceSn, "0");
        return callImouApi(
            "listDeviceAbility",
            new ImouModels.DeviceAbilityParams(accessToken, List.of(device)),
            ImouModels.DeviceAbilityData.class);
    }

    public Map<String, Object> unbindDevice(String deviceSn, String accessToken) {
        return callLegacyImouApi(
            "unBindDevice", Map.of("deviceId", deviceSn, "token", accessToken));
    }

    public ImouModels.LiveStreamData getLiveStreamInfo(String deviceSn, String accessToken) {
        return callImouApi(
            "getLiveStreamInfo",
            new ImouModels.LiveStreamParams(accessToken, deviceSn, "0"),
            ImouModels.LiveStreamData.class);
    }

    public Map<String, Object> captureSnapshot(String deviceSn, String accessToken) {
        return callLegacyImouApi("captureCameraSnapshot", withToken(Map.of(
            "deviceId", deviceSn,
            "channelId", "0"), accessToken));
    }

    public Map<String, Object> startTwoWayAudio(String deviceSn, String accessToken) {
        return callLegacyImouApi("startTwoWayAudio", withToken(Map.of(
            "deviceId", deviceSn,
            "channelId", "0"), accessToken));
    }

    public Map<String, Object> stopTwoWayAudio(String deviceSn, String accessToken) {
        return callLegacyImouApi("stopTwoWayAudio", withToken(Map.of(
            "deviceId", deviceSn,
            "channelId", "0"), accessToken));
    }

    public Map<String, Object> setPrivacyMode(String deviceSn, boolean enabled, String accessToken) {
        return callLegacyImouApi("setPrivacyMode", withToken(Map.of(
            "deviceId", deviceSn,
            "enable", enabled ? "1" : "0"), accessToken));
    }

    public Map<String, Object> getDeviceStatus(String deviceSn, String accessToken) {
        return callLegacyImouApi(
            "getDeviceStatus", Map.of("deviceId", deviceSn, "token", accessToken));
    }

    public Map<String, Object> getMotionEvents(
        String deviceSn,
        String beginTime,
        String endTime,
        String accessToken
    ) {
        return callLegacyImouApi("getMotionDetectEvents", withToken(Map.of(
            "deviceId", deviceSn,
            "channelId", "0",
            "beginTime", beginTime,
            "endTime", endTime,
            "limit", "50"), accessToken));
    }

    public Map<String, Object> controlPtz(String deviceSn, String direction, String accessToken) {
        return callLegacyImouApi("ptzControl", withToken(Map.of(
            "deviceId", deviceSn,
            "channelId", "0",
            "operation", direction.toUpperCase(),
            "duration", "1000"), accessToken));
    }

    public String getAccessToken() {
        if (!isConfigured()) {
            log.warn("IMOU API is not configured");
            return null;
        }
        ImouModels.AccessTokenData result = callImouApi(
            "accessToken", ImouModels.emptyParams(), ImouModels.AccessTokenData.class);
        return result.accessToken();
    }

    private <T> T callImouApi(String method, Object params, Class<T> dataType) {
        if (!isConfigured()) {
            throw new ImouApiException(
                ImouApiException.Kind.PROVIDER_UNAVAILABLE,
                "IMOU_DISABLED",
                "IMOU integration is not configured");
        }

        try {
            long time = Instant.now(clock).getEpochSecond();
            String nonce = uuidSupplier.get().toString();
            String requestId = uuidSupplier.get().toString();
            ImouModels.SystemParameters system = new ImouModels.SystemParameters(
                "1.0",
                properties.getAppId(),
                signer.sign(time, nonce, properties.getAppSecret()),
                time,
                nonce);
            ImouModels.RequestEnvelope<Object> body =
                new ImouModels.RequestEnvelope<>(system, requestId, params);

            String response = restClient.post()
                .uri("/openapi/{method}", method)
                .header("Content-Type", "application/json")
                .body(body)
                .retrieve()
                .body(String.class);

            JsonNode json = objectMapper.readTree(response);
            String code = json.path("result").path("code").asText();
            if (!"0".equals(code)) {
                throw providerException(code);
            }

            if (dataType == Void.class) {
                return null;
            }
            JsonNode data = json.path("result").path("data");
            if (data.isMissingNode() || data.isNull()) {
                throw new ImouApiException(
                    ImouApiException.Kind.PROVIDER_REJECTED,
                    "MALFORMED_RESPONSE",
                    "IMOU returned an incomplete response");
            }
            return objectMapper.treeToValue(data, dataType);
        } catch (ImouApiException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("IMOU request failed: method={} type={}", method, ex.getClass().getSimpleName());
            throw new ImouApiException(
                ImouApiException.Kind.PROVIDER_UNAVAILABLE,
                "TRANSPORT_ERROR",
                "IMOU service is unavailable",
                ex);
        }
    }

    private Map<String, Object> callLegacyImouApi(String method, Map<String, Object> params) {
        JsonNode data = callImouApi(method, params, JsonNode.class);
        @SuppressWarnings("unchecked")
        Map<String, Object> result = objectMapper.convertValue(data, Map.class);
        return result;
    }

    private Map<String, Object> withToken(Map<String, Object> params, String accessToken) {
        Map<String, Object> copy = new LinkedHashMap<>(params);
        copy.put("token", accessToken);
        return copy;
    }

    private ImouApiException providerException(String code) {
        ImouApiException.Kind kind = switch (code) {
            case "SN1001", "SN1002", "SN1003", "SN1004", "TK1002", "TK1003" ->
                ImouApiException.Kind.INVALID_CREDENTIALS;
            case "DV1001", "DV1033" -> ImouApiException.Kind.BOUND_TO_ANOTHER_ACCOUNT;
            case "DV1003" -> ImouApiException.Kind.ALREADY_OWNED;
            case "DV1005", "DV1016", "DV1025", "DV1027" ->
                ImouApiException.Kind.INVALID_DEVICE_CODE;
            case "DV1013", "DV1018", "DV1019", "DV1026", "DV1034", "DV1043", "DV1044" ->
                ImouApiException.Kind.UNSUPPORTED_DEVICE;
            case "OP1010", "OP1011", "OP1013", "OP1014", "OP1026", "DV1009" ->
                ImouApiException.Kind.PROVIDER_UNAVAILABLE;
            default -> ImouApiException.Kind.PROVIDER_REJECTED;
        };
        log.warn("IMOU request rejected: code={}", code);
        return new ImouApiException(kind, code, "IMOU rejected the request (" + code + ")");
    }
}
