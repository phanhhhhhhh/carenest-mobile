package com.carenest.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;

@Slf4j
@Service
public class SmsService {

    @Value("${sms.speedsms.api-url}")
    private String apiUrl;

    @Value("${sms.speedsms.access-token:}")
    private String accessToken;

    @Value("${sms.speedsms.sender:}")
    private String sender;

    @Value("${sms.speedsms.type:2}")
    private int smsType;

    private final HttpClient httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(10))
        .build();

    public void sendOtp(String phone, String code) {
        String message = "Ma xac thuc CareNest cua ban la: " + code + ". Ma co hieu luc trong 10 phut.";
        send(phone, message);
    }

    private void send(String phone, String message) {
        if (accessToken == null || accessToken.isBlank()) {
            log.warn("sms.speedsms.access-token not configured — skipping SMS to {}", phone);
            return;
        }

        String localPhone = toLocalFormat(phone);
        String body = """
            {"to":["%s"],"content":"%s","sms_type":%d,"sender":"%s"}
            """.formatted(localPhone, message, smsType, sender == null ? "" : sender).trim();

        String basicAuth = Base64.getEncoder()
            .encodeToString((accessToken + ":x").getBytes(StandardCharsets.UTF_8));

        try {
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl))
                .timeout(Duration.ofSeconds(10))
                .header("Content-Type", "application/json")
                .header("Authorization", "Basic " + basicAuth)
                .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("SMS sent via SpeedSMS to {}: status={}", phone, response.statusCode());
            } else {
                log.error("SpeedSMS request failed for {}: status={} body={}",
                    phone, response.statusCode(), response.body());
            }
        } catch (Exception e) {
            log.error("Failed to send SMS to {}: {}", phone, e.getMessage());
        }
    }

    private String toLocalFormat(String phone) {
        if (phone != null && phone.startsWith("+84")) {
            return "0" + phone.substring(3);
        }
        return phone;
    }
}
