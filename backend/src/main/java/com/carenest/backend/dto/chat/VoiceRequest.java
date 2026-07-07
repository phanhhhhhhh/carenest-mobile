package com.carenest.backend.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

/**
 * UC-17: Voice Input request DTO.
 * Accepts an audio file for speech-to-text transcription
 * before routing through the AI chat pipeline.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VoiceRequest {

    /**
     * Audio file (MP3, WAV, WEBM, OGG supported).
     */
    private MultipartFile audio;

    /**
     * Optional session ID for conversation continuity.
     * If not provided, defaults to the user's default session.
     */
    private String sessionId;

    /**
     * Spoken language hint (e.g., "vi", "en").
     * Helps the STT model optimize recognition accuracy.
     * Defaults to auto-detect if not specified.
     */
    private String language;
}
