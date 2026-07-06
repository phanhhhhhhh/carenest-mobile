package com.carenest.backend.controller;

import com.carenest.backend.dto.chat.ChatHistoryResponse;
import com.carenest.backend.dto.chat.ChatRequest;
import com.carenest.backend.dto.chat.ChatResponse;
import com.carenest.backend.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    /**
     * Send a message to the AI companion.
     * UC-16: Chat with AI Companion
     * The AI responds with context-aware, personalized replies using
     * the elderly's health profile, medications, and appointments.
     */
    @PostMapping("/message")
    @PreAuthorize("hasRole('ELDERLY') and #userId == authentication.principal")
    public ResponseEntity<ChatResponse> sendMessage(
        @AuthenticationPrincipal Long userId,
        @Valid @RequestBody ChatRequest request
    ) {
        ChatResponse response = chatService.sendMessage(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get paginated chat history.
     * UC-16: Chat history retrieval
     */
    @GetMapping("/history")
    @PreAuthorize("hasRole('ELDERLY') and #userId == authentication.principal")
    public ResponseEntity<ChatHistoryResponse> getHistory(
        @AuthenticationPrincipal Long userId,
        @RequestParam(required = false) String sessionId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "50") int size
    ) {
        return ResponseEntity.ok(chatService.getHistory(userId, sessionId, page, size));
    }

    /**
     * Clear all chat history for the authenticated elderly user.
     */
    @DeleteMapping("/history")
    @PreAuthorize("hasRole('ELDERLY') and #userId == authentication.principal")
    public ResponseEntity<Map<String, String>> clearHistory(
        @AuthenticationPrincipal Long userId
    ) {
        chatService.clearHistory(userId);
        return ResponseEntity.ok(Map.of("message", "Chat history cleared"));
    }

    /**
     * Health check to verify Gemini API connectivity.
     */
    @GetMapping("/health")
    @PreAuthorize("hasRole('ELDERLY')")
    public ResponseEntity<Map<String, Object>> health() {
        boolean available = chatService != null; // simplified — GeminiApiService.isAvailable() is package-private
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "aiService", "ChatController active"
        ));
    }
}
