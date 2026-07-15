package com.carenest.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;


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

    
    @Column(name = "image_url", length = 1024)
    private String imageUrl;

    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SnapshotTrigger trigger;

    
    @Column(name = "emergency_event_id")
    private Long emergencyEventId;

    
    @Builder.Default
    private boolean success = true;

    
    @Column(length = 500)
    private String errorMessage;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;

    public enum SnapshotTrigger {
        SOS, SCHEDULED, MANUAL
    }
}
