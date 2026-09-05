package com.carenest.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "family_links", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"elderly_id", "family_id"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"elderly", "family", "createdAt", "updatedAt", "deletedAt"})
public class FamilyLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "elderly_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User elderly;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "family_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User family;

    @Column(nullable = false, length = 50)
    private String relationship;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private FamilyLinkStatus status = FamilyLinkStatus.PENDING;

    /** Self-set FREE/BUSY for the sequential Free Broadcast (UC A3). Not used for SOS. */
    @Enumerated(EnumType.STRING)
    @Column(name = "availability_status", nullable = false, length = 10)
    @Builder.Default
    private AvailabilityStatus availabilityStatus = AvailabilityStatus.FREE;

    /** When this member last acknowledged a daily broadcast — for fairness ordering. */
    @Column(name = "last_ack_at")
    private OffsetDateTime lastAckAt;

    /** When this member was last paged by a sequential broadcast — oldest goes first. */
    @Column(name = "last_notified_at")
    private OffsetDateTime lastNotifiedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;
}