package com.carenest.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * Low-level REST client for Google Gemini API.
 * Used by ChatService, AnomalyDetectionService, and WeeklySummaryService.
 */
@Slf4j
@Service
public class GeminiApiService {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.api.model:gemini-2.0-flash}")
    private String model;

    @Value("${gemini.api.max-tokens:1024}")
    private int maxTokens;

    @Value("${gemini.api.temperature:0.7}")
    private double temperature;

    private static final String GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

    public GeminiApiService(ObjectMapper objectMapper) {
        this.restClient = RestClient.builder().build();
        this.objectMapper = objectMapper;
    }

    /**
     * Generate a text response from Gemini with a system prompt and user message.
     */
    public String generateContent(String systemPrompt, String userMessage) {
        return generateContent(systemPrompt, userMessage, temperature, maxTokens);
    }

    /**
     * Generate a text response with custom temperature and max tokens.
     */
    public String generateContent(String systemPrompt, String userMessage, double overrideTemp, int overrideMaxTokens) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Gemini API key not configured — returning fallback response");
            return "[AI service unavailable — GEMINI_API_KEY not configured]";
        }

        try {
            // Build the full prompt with system + user
            String fullPrompt = buildFullPrompt(systemPrompt, userMessage);

            Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                    Map.of("parts", List.of(
                        Map.of("text", fullPrompt)
                    ))
                ),
                "generationConfig", Map.of(
                    "temperature", overrideTemp,
                    "maxOutputTokens", overrideMaxTokens,
                    "topP", 0.95
                ),
                "safetySettings", List.of(
                    Map.of("category", "HARM_CATEGORY_HARASSMENT", "threshold", "BLOCK_ONLY_HIGH"),
                    Map.of("category", "HARM_CATEGORY_HATE_SPEECH", "threshold", "BLOCK_ONLY_HIGH"),
                    Map.of("category", "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold", "BLOCK_ONLY_HIGH"),
                    Map.of("category", "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold", "BLOCK_ONLY_HIGH")
                )
            );

            String responseJson = restClient.post()
                .uri(GEMINI_BASE_URL + "/models/" + model + ":generateContent?key=" + apiKey)
                .header("Content-Type", "application/json")
                .body(objectMapper.writeValueAsString(requestBody))
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, res) -> {
                    log.error("Gemini API error: {} — body: {}", res.getStatusCode(), new String(res.getBody().readAllBytes()));
                })
                .body(String.class);

            return extractText(responseJson);
        } catch (Exception e) {
            log.error("Failed to call Gemini API: {}", e.getMessage(), e);
            return "[AI service temporarily unavailable — please try again later]";
        }
    }

    /**
     * Generate a health analysis with lower temperature for more factual output.
     */
    public String generateHealthAnalysis(String systemPrompt, String data) {
        return generateContent(systemPrompt, data, 0.3, 2048);
    }

    /**
     * Generate a friendly conversational response with higher temperature.
     */
    public String generateConversational(String systemPrompt, String userMessage) {
        return generateContent(systemPrompt, userMessage, 0.85, 1024);
    }

    /**
     * Check if Gemini API is available.
     */
    public boolean isAvailable() {
        return apiKey != null && !apiKey.isBlank();
    }

    /**
     * UC-17: Transcribe audio to text using Gemini's multimodal capabilities.
     * Sends raw audio bytes as inlineData and returns the transcribed text.
     *
     * @param audioData raw audio bytes (MP3, WAV, WEBM, OGG)
     * @param mimeType  MIME type of the audio (e.g., "audio/mp3", "audio/wav")
     * @return transcribed text, or null if transcription failed
     */
    public String transcribeAudio(byte[] audioData, String mimeType) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Gemini API key not configured — cannot transcribe audio");
            return null;
        }

        try {
            String base64Audio = Base64.getEncoder().encodeToString(audioData);

            Map<String, Object> inlineData = Map.of(
                "mimeType", mimeType != null ? mimeType : "audio/webm",
                "data", base64Audio
            );

            Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                    Map.of("parts", List.of(
                        Map.of("inlineData", inlineData),
                        Map.of("text", "Transcribe the spoken words in this audio clip. "
                            + "Return ONLY the transcribed text, nothing else. "
                            + "If the audio is in Vietnamese, transcribe in Vietnamese. "
                            + "If the audio is in English, transcribe in English. "
                            + "Do not add explanations, punctuation corrections, or commentary.")
                    ))
                ),
                "generationConfig", Map.of(
                    "temperature", 0.1,
                    "maxOutputTokens", 1024,
                    "topP", 0.95
                )
            );

            String responseJson = restClient.post()
                .uri(GEMINI_BASE_URL + "/models/" + model + ":generateContent?key=" + apiKey)
                .header("Content-Type", "application/json")
                .body(objectMapper.writeValueAsString(requestBody))
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, res) -> {
                    log.error("Gemini STT error: {} — body: {}",
                        res.getStatusCode(), new String(res.getBody().readAllBytes()));
                })
                .body(String.class);

            return extractText(responseJson);
        } catch (Exception e) {
            log.error("Failed to transcribe audio via Gemini: {}", e.getMessage(), e);
            return null;
        }
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private String buildFullPrompt(String systemPrompt, String userMessage) {
        if (systemPrompt == null || systemPrompt.isBlank()) {
            return userMessage;
        }
        return systemPrompt + "\n\n---\n\nUser message: " + userMessage;
    }

    private String extractText(String responseJson) {
        try {
            JsonNode root = objectMapper.readTree(responseJson);
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && candidates.size() > 0) {
                JsonNode parts = candidates.get(0).path("content").path("parts");
                if (parts.isArray() && parts.size() > 0) {
                    String text = parts.get(0).path("text").asText();
                    return text != null && !text.isBlank() ? text : "[Empty response from AI]";
                }
            }
            // Check for prompt feedback / safety blocks
            JsonNode promptFeedback = root.path("promptFeedback");
            if (promptFeedback.has("blockReason")) {
                log.warn("Gemini response blocked: {}", promptFeedback.path("blockReason").asText());
                return "[Response blocked by safety filter]";
            }
            log.warn("Unexpected Gemini response structure: {}", responseJson.substring(0, Math.min(300, responseJson.length())));
            return "[Unexpected AI response format]";
        } catch (Exception e) {
            log.error("Failed to parse Gemini response: {}", e.getMessage());
            return "[Failed to process AI response]";
        }
    }
}
