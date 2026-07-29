package com.carenest.backend.exception;

/**
 * Thrown by {@link com.carenest.backend.service.GeminiApiService} whenever a call to the
 * Gemini API cannot produce a genuine reply — missing API key, network/timeout failure,
 * a safety-filter block, or a malformed/unexpected response body.
 *
 * Callers (e.g. {@link com.carenest.backend.service.ChatService}) can catch this to tell a
 * real AI reply apart from a failure, instead of relying on brittle bracketed placeholder
 * strings such as "[AI service temporarily unavailable — please try again later]".
 */
public class GeminiApiException extends RuntimeException {
    public GeminiApiException(String message) {
        super(message);
    }

    public GeminiApiException(String message, Throwable cause) {
        super(message, cause);
    }
}
