package com.carenest.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/**
 * One in-flight sequential Free Broadcast (UC A3 / A4). Created when a daily
 * attention event fires; a scheduled job advances {@code currentRecipient}
 * every ~15 min with no ack, then escalates to the whole family.
 */
@Entity
@Table(name = "family_broadcasts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FamilyBroadcast {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "elderly_id", nullable = false)
    private Long elderlyId;

    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_type", nullable = false, length = 30)
    private BroadcastTriggerType triggerType;

    /** Optional id of the row that triggered this (e.g. the check-in id). */
    @Column(name = "trigger_ref")
    private Long triggerRef;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 500)
    private String body;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private BroadcastStatus status = BroadcastStatus.ACTIVE;

    @Column(name = "current_recipient_id")
    private Long currentRecipientId;

    /** CSV of user ids already paged by this broadcast — never re-paged. */
    @Column(name = "notified_user_ids", columnDefinition = "TEXT")
    private String notifiedUserIds;

    @Column(name = "started_at", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime startedAt = OffsetDateTime.now();

    @Column(name = "current_notified_at")
    private OffsetDateTime currentNotifiedAt;

    @Column(name = "acknowledged_at")
    private OffsetDateTime acknowledgedAt;

    @Column(name = "acknowledged_by")
    private Long acknowledgedBy;

    @Column(name = "escalated_at")
    private OffsetDateTime escalatedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
