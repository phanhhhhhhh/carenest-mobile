package com.carenest.backend.controller;

import com.carenest.backend.dto.chat.ChatRequest;
import com.carenest.backend.dto.chat.ChatResponse;
import com.carenest.backend.service.ChatService;
import com.carenest.backend.service.SpeechToTextService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;


@Slf4j
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class VoiceController {

    private final SpeechToTextService speechToTextService;
    private final ChatService chatService;

    private static final long MAX_AUDIO_SIZE = 10 * 1024 * 1024;

    
    @PostMapping(value = "/voice", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ELDERLY') and #userId == authentication.principal")
    public ResponseEntity<?> transcribeAndChat(
        @AuthenticationPrincipal Long userId,
        @RequestParam("audio") MultipartFile audio,
        @RequestParam(value = "sessionId", required = false) String sessionId,
        @RequestParam(value = "language", required = false, defaultValue = "vi") String language
    ) {
        if (audio.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Audio file is empty",
                "message", "Please provide a valid audio recording"
            ));
        }

        if (audio.getSize() > MAX_AUDIO_SIZE) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Audio file too large",
                "message", "Maximum audio size is 10 MB"
            ));
        }

        if (!speechToTextService.isAvailable()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                "error", "Speech-to-text service is not available",
                "message", "GEMINI_API_KEY is not configured"
            ));
        }

        try {
            String mimeType = audio.getContentType();
            if (mimeType == null || mimeType.isBlank()) {
                mimeType = "audio/webm";
            }

            log.info("Transcribing audio: userId={} size={}bytes mimeType={} language={}",
                userId, audio.getSize(), mimeType, language);
            String transcribedText = speechToTextService.transcribe(audio.getBytes(), mimeType);

            if (transcribedText == null || transcribedText.isBlank()) {
                return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(Map.of(
                    "error", "Transcription failed",
                    "message", "Could not transcribe the audio. Please try speaking more clearly."
                ));
            }

            log.info("Transcription result for userId={}: {} chars — \"{}\"",
                userId, transcribedText.length(),
                transcribedText.length() > 100 ? transcribedText.substring(0, 100) + "..." : transcribedText);

            ChatRequest chatRequest = new ChatRequest();
            chatRequest.setMessage(transcribedText);
            chatRequest.setSessionId(sessionId);

            ChatResponse chatResponse = chatService.sendMessage(userId, chatRequest);

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "transcription", transcribedText,
                "messageId", chatResponse.getMessageId(),
                "role", chatResponse.getRole(),
                "content", chatResponse.getContent(),
                "intent", chatResponse.getIntent() != null ? chatResponse.getIntent() : "GENERAL",
                "sessionId", chatResponse.getSessionId(),
                "createdAt", chatResponse.getCreatedAt()
            ));

        } catch (com.carenest.backend.exception.PaymentRequiredException e) {
            // Free daily companion allowance exhausted — surface the upgrade prompt.
            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(Map.of(
                "error", "Free daily limit reached",
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Voice chat failed for userId={}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Voice processing failed",
                "message", "An unexpected error occurred. Please try again."
            ));
        }
    }

    
    @GetMapping("/voice/health")
    @PreAuthorize("hasRole('ELDERLY')")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "sttAvailable", speechToTextService.isAvailable(),
            "maxAudioSizeBytes", MAX_AUDIO_SIZE,
            "supportedFormats", new String[]{"audio/webm", "audio/mp3", "audio/wav", "audio/ogg"}
        ));
    }
}
