package com.carenest.backend.repository;

import com.carenest.backend.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    /**
     * Get chat history for a user ordered by most recent first.
     */
    Page<ChatMessage> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /**
     * Get chat history for a user within a specific session.
     */
    Page<ChatMessage> findByUserIdAndSessionIdOrderByCreatedAtDesc(Long userId, String sessionId, Pageable pageable);

    /**
     * Get messages for building AI context (last N messages, chronological).
     */
    List<ChatMessage> findTop20ByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * Delete all messages for a user (reset chat).
     */
    void deleteByUserId(Long userId);

    /**
     * Count messages for a user.
     */
    long countByUserId(Long userId);
}
