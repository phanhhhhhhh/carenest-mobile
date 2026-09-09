package com.carenest.backend.dto.camera;

import java.util.List;
import java.util.Map;

public final class ImouModels {

    private ImouModels() {
    }

    public record SystemParameters(String ver, String appId, String sign, long time, String nonce) {}
    public record RequestEnvelope<T>(SystemParameters system, String id, T params) {}
    public record AccessTokenData(String accessToken, long expireTime) {}
    public record DeviceParams(String token, String deviceId) {}
    public record BindDeviceParams(String token, String deviceId, String code) {}
    public record BindingState(boolean isBind, boolean isMine) {}
    public record OnlineChannel(String channelId, String onLine) {}
    public record DeviceOnlineData(String deviceId, String onLine, List<OnlineChannel> channels) {}
    public record LiveStreamParams(String token, String deviceId, String channelId) {}
    public record LiveStream(String hls, Integer streamId, String status, String liveToken) {}
    public record LiveStreamData(List<LiveStream> streams) {}
    public record AbilityDeviceRequest(String deviceId, String channelList) {}
    public record DeviceAbilityParams(String token, List<AbilityDeviceRequest> deviceList) {}
    public record AbilityChannel(String channelId, String channelAbility) {}
    public record AbilityAccessory(String apId, String apAbility) {}
    public record AbilityDevice(
        String deviceId,
        String ability,
        List<AbilityChannel> channels,
        List<AbilityAccessory> aps
    ) {}
    public record DeviceAbilityData(List<AbilityDevice> deviceList) {}

    public static Map<String, Object> emptyParams() {
        return Map.of();
    }
}
