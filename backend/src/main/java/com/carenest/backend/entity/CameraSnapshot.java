package com.carenest.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * UC-28 (SOS Snapshot) & UC-29 (Check-in Timeline):
 * Stores camera snapshots captured either on SOS trigger or on schedule.
 */
@Entity
@Table(name = "camera_snapshots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CameraSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "camera_id", nullable = false)
    private CameraDevice camera;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "elderly_id", nullable = false)
    private User elderly;

    /**
     * URL to the snapshot image (stored in Cloudinary or local storage).
     */
    @Column(name = "image_url", length = 1024)
    private String imageUrl;

    /**
     * Trigger type: SOS, SCHEDULED, MANUAL.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SnapshotTrigger trigger;

    /**
     * For SOS snapshots: the emergency event ID this snapshot belongs to.
     */
    @Column(name = "emergency_event_id")
    private Long emergencyEventId;

    /**
     * Whether the capture was successful.
     */
    @Builder.Default
    private boolean success = true;

    /**
     * Error message if capture failed.
     */
    @Column(length = 500)
    private String errorMessage;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;

    public enum SnapshotTrigger {
        SOS, SCHEDULED, MANUAL
    }
}
