package com.carenest.backend.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatResponse {

    private Long messageId;
    private String role;        // "USER" or "AI"
    private String content;
    private String intent;      // AI intent classification (null for user messages)
    private String sessionId;
    private Instant createdAt;
}
