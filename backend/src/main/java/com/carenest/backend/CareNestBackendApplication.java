package com.carenest.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@SpringBootApplication
@EnableScheduling
@EnableAsync
public class CareNestBackendApplication {
    public static void main(String[] args) {
        loadDotEnv();
        SpringApplication.run(CareNestBackendApplication.class, args);
    }

    /**
     * Spring only reads real OS env vars / -D system properties, not the repo-root
     * .env file — so launching via `mvn spring-boot:run`, an IDE run button, or
     * `java -jar` from a shell that never sourced .env silently falls back to the
     * hardcoded defaults in application.properties (e.g. CORS_ALLOWED_ORIGINS
     * defaulting to :8082 only, breaking every :8081 web-app request with CORS).
     * Walk up from the working directory to find .env and seed it as system
     * properties before Spring's environment is built, so every launch method
     * behaves the same. Real env vars / -D flags still win if already set.
     */
    private static void loadDotEnv() {
        Path dir = Paths.get("").toAbsolutePath();
        for (int i = 0; i < 5 && dir != null; i++, dir = dir.getParent()) {
            Path envFile = dir.resolve(".env");
            if (!Files.exists(envFile)) {
                continue;
            }
            try {
                for (String line : Files.readAllLines(envFile)) {
                    String trimmed = line.trim();
                    if (trimmed.isEmpty() || trimmed.startsWith("#")) {
                        continue;
                    }
                    int eq = trimmed.indexOf('=');
                    if (eq <= 0) {
                        continue;
                    }
                    String key = trimmed.substring(0, eq).trim();
                    String value = trimmed.substring(eq + 1).trim();
                    if (value.length() >= 2
                            && ((value.startsWith("\"") && value.endsWith("\""))
                                || (value.startsWith("'") && value.endsWith("'")))) {
                        value = value.substring(1, value.length() - 1);
                    }
                    if (System.getProperty(key) == null && System.getenv(key) == null) {
                        System.setProperty(key, value);
                    }
                }
            } catch (IOException e) {
                System.err.println("Warning: failed to read " + envFile + ": " + e.getMessage());
            }
            return;
        }
    }
}