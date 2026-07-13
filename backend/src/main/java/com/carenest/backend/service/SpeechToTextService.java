package com.carenest.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * UC-17: Speech-to-Text service.
 * Wraps GeminiApiService for audio transcription.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SpeechToTextService {

    private final GeminiApiService geminiApiService;

    /**
     * Transcribe audio bytes to text.
     *
     * @param audioData raw audio bytes
     * @param mimeType  MIME type (e.g., "audio/webm", "audio/mp3", "audio/wav")
     * @return transcribed text, or null if unavailable
     */
    public String transcribe(byte[] audioData, String mimeType) {
        if (!geminiApiService.isAvailable()) {
            log.warn("Gemini API not available — cannot transcribe audio");
            return null;
        }
        return geminiApiService.transcribeAudio(audioData, mimeType);
    }

    /**
     * Check if speech-to-text is available.
     */
    public boolean isAvailable() {
        return geminiApiService.isAvailable();
    }
}
