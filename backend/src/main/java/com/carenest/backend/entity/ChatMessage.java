package com.carenest.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;

@Entity
@Table(name = "chat_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * Who sent the message: USER (elderly) or AI (Gemini).
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ChatRole role;

    /**
     * Full message content (Markdown supported for AI responses).
     */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /**
     * AI intent classification: HEALTH, MEDICATION, APPOINTMENT, GENERAL, REMINDER.
     * Null for user messages.
     */
    @Column(length = 30)
    private String intent;

    /**
     * Structured context data used to generate this message
     * (e.g., {"healthMetrics": [...], "medications": [...]}).
     * Stored as JSON for auditability but not actively queried.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> contextData;

    /**
     * Session identifier so chat histories can be segmented/reset.
     * Defaults to the user ID as a simple single-session model.
     */
    @Column(length = 64)
    private String sessionId;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;

    public enum ChatRole {
        USER, AI
    }
}
