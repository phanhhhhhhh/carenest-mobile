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
    private String role;
    private String content;
    private String intent;
    private String sessionId;
    private Instant createdAt;

    /**
     * Companion messages the free plan has left today (UC A5). Null for Family
     * Plus (unlimited). Zero means the next message needs an upgrade.
     */
    private Integer remainingFreeMessages;
}
