package com.carenest.backend.repository;

import com.carenest.backend.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    
    Page<ChatMessage> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    
    Page<ChatMessage> findByUserIdAndSessionIdOrderByCreatedAtDesc(Long userId, String sessionId, Pageable pageable);

    
    List<ChatMessage> findTop20ByUserIdOrderByCreatedAtDesc(Long userId);

    
    void deleteByUserId(Long userId);

    
    long countByUserId(Long userId);
}
