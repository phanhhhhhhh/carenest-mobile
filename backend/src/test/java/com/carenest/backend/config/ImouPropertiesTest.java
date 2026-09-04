package com.carenest.backend.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.LazyInitializationBeanFactoryPostProcessor;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.validation.ValidationAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

class ImouPropertiesTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
        .withConfiguration(AutoConfigurations.of(ValidationAutoConfiguration.class))
        .withUserConfiguration(TestConfiguration.class)
        .withInitializer(context -> context.addBeanFactoryPostProcessor(
            new LazyInitializationBeanFactoryPostProcessor()));

    @Test
    void disabledIntegrationAllowsEmptyCredentials() {
        contextRunner.run(context -> {
            assertThat(context).hasNotFailed();

            ImouProperties properties = context.getBean(ImouProperties.class);
            assertThat(properties.isEnabled()).isFalse();
            assertThat(properties.getAppId()).isEmpty();
            assertThat(properties.getAppSecret()).isEmpty();
            assertThat(properties.getBaseUrl()).isEqualTo("https://openapi.imoulife.com");
            assertThat(properties.getConnectionTimeout()).isEqualTo(Duration.ofSeconds(10));
            assertThat(properties.getReadTimeout()).isEqualTo(Duration.ofSeconds(30));
        });
    }

    @Test
    void enabledIntegrationRejectsEmptyCredentials() {
        contextRunner
            .withPropertyValues("imou.api.enabled=true")
            .run(context -> {
                assertThat(context).hasFailed();
                assertThat(rootCause(context.getStartupFailure()))
                    .hasMessageContaining("app-id and app-secret must be configured when imou.api.enabled=true");
            });
    }

    @Test
    void enabledIntegrationAcceptsCredentialsAndBindsTimeouts() {
        contextRunner
            .withPropertyValues(
                "imou.api.enabled=true",
                "imou.api.app-id=test-app-id",
                "imou.api.app-secret=test-app-secret",
                "imou.api.connection-timeout=2s",
                "imou.api.read-timeout=5s"
            )
            .run(context -> {
                assertThat(context).hasNotFailed();

                ImouProperties properties = context.getBean(ImouProperties.class);
                assertThat(properties.isEnabled()).isTrue();
                assertThat(properties.getConnectionTimeout()).isEqualTo(Duration.ofSeconds(2));
                assertThat(properties.getReadTimeout()).isEqualTo(Duration.ofSeconds(5));
            });
    }

    @Configuration(proxyBeanMethods = false)
    @EnableConfigurationProperties
    @Import(ImouProperties.class)
    static class TestConfiguration {
    }

    private Throwable rootCause(Throwable throwable) {
        Throwable cause = throwable;
        while (cause.getCause() != null) {
            cause = cause.getCause();
        }
        return cause;
    }
}
