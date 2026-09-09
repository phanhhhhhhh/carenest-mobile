package com.carenest.backend.service;

import com.carenest.backend.config.ImouProperties;
import com.carenest.backend.dto.camera.ImouModels;
import com.carenest.backend.exception.ImouApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ImouApiServiceTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final AtomicReference<String> responseBody = new AtomicReference<>();
    private final AtomicReference<String> requestPath = new AtomicReference<>();
    private final AtomicReference<String> requestBody = new AtomicReference<>();
    private HttpServer server;
    private ImouApiService service;

    @BeforeEach
    void setUp() throws IOException {
        server = HttpServer.create(new InetSocketAddress(0), 0);
        server.createContext("/", this::respond);
        server.start();

        ImouProperties properties = new ImouProperties();
        properties.setEnabled(true);
        properties.setBaseUrl("http://localhost:" + server.getAddress().getPort());
        properties.setAppId("test-app-id");
        properties.setAppSecret("test123456789test123456789");

        Clock clock = Clock.fixed(Instant.ofEpochSecond(1706511734L), ZoneOffset.UTC);
        UUID fixedUuid = UUID.fromString("f5a1ae2d-c09c-4d39-a744-83a5c2c653c2");
        service = new ImouApiService(
            objectMapper, properties, new ImouRequestSigner(), clock, () -> fixedUuid);
    }

    @AfterEach
    void tearDown() {
        server.stop(0);
    }

    @Test
    void accessTokenUsesOfficialEndpointAndSignedEnvelope() throws Exception {
        responseBody.set("""
            {"result":{"code":"0","msg":"Successful operation.","data":{
              "accessToken":"At_contract_token","expireTime":259176
            }},"id":"request-id"}
            """);

        assertThat(service.getAccessToken()).isEqualTo("At_contract_token");
        assertThat(requestPath.get()).isEqualTo("/openapi/accessToken");

        JsonNode body = objectMapper.readTree(requestBody.get());
        assertThat(body.has("method")).isFalse();
        assertThat(body.path("params").size()).isZero();
        assertThat(body.path("system").path("ver").asText()).isEqualTo("1.0");
        assertThat(body.path("system").path("appId").asText()).isEqualTo("test-app-id");
        assertThat(body.path("system").path("time").asLong()).isEqualTo(1706511734L);
        assertThat(body.path("system").path("nonce").asText())
            .isEqualTo("f5a1ae2d-c09c-4d39-a744-83a5c2c653c2");
        assertThat(body.path("system").path("sign").asText())
            .isEqualTo("xjhCQBoJ9hRDsCjyDcHjtDNzRZ3ZJezcawsfWeiaoxU=");
        assertThat(requestBody.get()).doesNotContain("appSecret");
    }

    @Test
    void d2CallsUseOfficialPathsAndTypedParameters() throws Exception {
        responseBody.set("""
            {"result":{"code":"0","data":{"isBind":true,"isMine":true}},"id":"id"}
            """);
        ImouModels.BindingState state = service.checkDeviceBinding("ABC123", "At_token");
        assertThat(state.isBind()).isTrue();
        assertThat(state.isMine()).isTrue();
        assertThat(requestPath.get()).isEqualTo("/openapi/checkDeviceBindOrNot");
        assertThat(objectMapper.readTree(requestBody.get()).path("params").path("token").asText())
            .isEqualTo("At_token");

        responseBody.set("{" +
            "\"result\":{\"code\":\"0\",\"msg\":\"Successful operation.\"},\"id\":\"id\"}");
        service.bindDevice("ABC123", "SC1234", "At_token");
        assertThat(requestPath.get()).isEqualTo("/openapi/bindDevice");
        JsonNode bindParams = objectMapper.readTree(requestBody.get()).path("params");
        assertThat(bindParams.path("deviceId").asText()).isEqualTo("ABC123");
        assertThat(bindParams.path("code").asText()).isEqualTo("SC1234");

        responseBody.set("""
            {"result":{"code":"0","data":{"deviceId":"ABC123","onLine":"0",
              "channels":[{"channelId":"0","onLine":"0"}]}},"id":"id"}
            """);
        assertThat(service.deviceOnline("ABC123", "At_token").onLine()).isEqualTo("0");
        assertThat(requestPath.get()).isEqualTo("/openapi/deviceOnline");

        responseBody.set("""
            {"result":{"code":"0","data":{"deviceList":[{"deviceId":"ABC123",
              "ability":"WLAN","channels":[{"channelId":"0","channelAbility":"AudioTalk"}],
              "aps":[]}]}},"id":"id"}
            """);
        assertThat(service.listDeviceAbility("ABC123", "At_token").deviceList()).hasSize(1);
        assertThat(requestPath.get()).isEqualTo("/openapi/listDeviceAbility");
        JsonNode abilityDevice = objectMapper.readTree(requestBody.get())
            .path("params").path("deviceList").get(0);
        assertThat(abilityDevice.path("channelList").asText()).isEqualTo("0");
        assertThat(abilityDevice.has("apList")).isFalse();
    }

    @Test
    void liveStreamUsesOfficialPathEnvelopeAndParsesTypedHlsStreams() throws Exception {
        responseBody.set("""
            {"result":{"code":"0","data":{"streams":[
              {"streamId":1,"liveToken":"live-token","hls":"https://video.example/live.m3u8?proto=https","status":"0"},
              {"streamId":0,"liveToken":"live-token","hls":"http://video.example/live.m3u8","status":"0"}
            ]}},"id":"id"}
            """);

        ImouModels.LiveStreamData data = service.getLiveStreamInfo("ABC123", "At_token");

        assertThat(requestPath.get()).isEqualTo("/openapi/getLiveStreamInfo");
        JsonNode params = objectMapper.readTree(requestBody.get()).path("params");
        assertThat(params.path("token").asText()).isEqualTo("At_token");
        assertThat(params.path("deviceId").asText()).isEqualTo("ABC123");
        assertThat(params.path("channelId").asText()).isEqualTo("0");
        assertThat(params.has("streamType")).isFalse();
        assertThat(data.streams()).hasSize(2);
        assertThat(data.streams().get(0).streamId()).isEqualTo(1);
        assertThat(data.streams().get(0).hls()).startsWith("https://");
        assertThat(data.streams().get(0).liveToken()).isEqualTo("live-token");
    }

    @Test
    void providerCredentialErrorIsTypedAndDoesNotExposeProviderMessage() {
        responseBody.set("""
            {"result":{"code":"SN1004","msg":"secret diagnostic"},"id":"id"}
            """);

        assertThatThrownBy(service::getAccessToken)
            .isInstanceOfSatisfying(ImouApiException.class, ex -> {
                assertThat(ex.getKind()).isEqualTo(ImouApiException.Kind.INVALID_CREDENTIALS);
                assertThat(ex.getProviderCode()).isEqualTo("SN1004");
                assertThat(ex.getMessage()).doesNotContain("secret diagnostic");
            });
    }

    @Test
    void alreadyOwnedProviderCodeIsTypedForIdempotentBinding() {
        responseBody.set("""
            {"result":{"code":"DV1003","msg":"Already bound by current account"},"id":"id"}
            """);

        assertThatThrownBy(() -> service.bindDevice("ABC123", "", "At_token"))
            .isInstanceOfSatisfying(ImouApiException.class, ex ->
                assertThat(ex.getKind()).isEqualTo(ImouApiException.Kind.ALREADY_OWNED));
    }

    private void respond(HttpExchange exchange) throws IOException {
        requestPath.set(exchange.getRequestURI().getPath());
        requestBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
        byte[] bytes = responseBody.get().getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json");
        exchange.sendResponseHeaders(200, bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }
}
