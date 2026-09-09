package com.carenest.backend.config;

import jakarta.validation.constraints.AssertTrue;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

@Validated
@Lazy(false)
@Component
@ConfigurationProperties(prefix = "imou.api")
public class ImouProperties {

    private boolean enabled;
    private String baseUrl = "https://openapi.imoulife.com";
    private String appId = "";
    private String appSecret = "";
    private Duration connectionTimeout = Duration.ofSeconds(10);
    private Duration readTimeout = Duration.ofSeconds(30);

    @AssertTrue(message = "app-id and app-secret must be configured when imou.api.enabled=true")
    public boolean isCredentialsValid() {
        return !enabled || (hasText(appId) && hasText(appSecret));
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getAppId() {
        return appId;
    }

    public void setAppId(String appId) {
        this.appId = appId;
    }

    public String getAppSecret() {
        return appSecret;
    }

    public void setAppSecret(String appSecret) {
        this.appSecret = appSecret;
    }

    public Duration getConnectionTimeout() {
        return connectionTimeout;
    }

    public void setConnectionTimeout(Duration connectionTimeout) {
        this.connectionTimeout = connectionTimeout;
    }

    public Duration getReadTimeout() {
        return readTimeout;
    }

    public void setReadTimeout(Duration readTimeout) {
        this.readTimeout = readTimeout;
    }
}
