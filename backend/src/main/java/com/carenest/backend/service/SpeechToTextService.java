package com.carenest.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;


@Slf4j
@Service
@RequiredArgsConstructor
public class SpeechToTextService {

    private final GeminiApiService geminiApiService;

    
    public String transcribe(byte[] audioData, String mimeType) {
        if (!geminiApiService.isAvailable()) {
            log.warn("Gemini API not available — cannot transcribe audio");
            return null;
        }
        return geminiApiService.transcribeAudio(audioData, mimeType);
    }

    
    public boolean isAvailable() {
        return geminiApiService.isAvailable();
    }
}
