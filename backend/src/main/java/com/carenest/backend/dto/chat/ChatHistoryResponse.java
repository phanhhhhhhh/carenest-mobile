package com.carenest.backend.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatHistoryResponse {

    private List<ChatResponse> messages;
    private int page;
    private int size;
    private long totalMessages;
    private boolean hasMore;
}
