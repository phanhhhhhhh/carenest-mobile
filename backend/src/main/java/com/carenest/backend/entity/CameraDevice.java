package com.carenest.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * UC-26: A physical camera device linked to an elderly profile
 * via the Imou Open Platform.
 */
@Entity
@Table(name = "camera_devices", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"device_sn"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CameraDevice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "elderly_id", nullable = false)
    private User elderly;

    /**
     * Human-readable label (e.g., "Living Room", "Bedroom").
     */
    @Column(nullable = false, length = 100)
    private String label;

    /**
     * Imou device serial number (unique hardware identifier).
     */
    @Column(name = "device_sn", nullable = false, length = 64)
    private String deviceSn;

    /**
     * Imou device ID assigned after binding.
     */
    @Column(name = "device_id", length = 64)
    private String deviceId;

    /**
     * Imou access token for API calls.
     */
    @Column(name = "access_token", length = 512)
    private String accessToken;

    /**
     * Current connection status: ONLINE, OFFLINE, PRIVACY, ERROR.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private CameraStatus status = CameraStatus.OFFLINE;

    /**
     * When the camera was last seen online.
     */
    private Instant lastSeenAt;

    /**
     * UC-32: Privacy mode — when true, camera streaming is disabled.
     */
    @Builder.Default
    private boolean privacyMode = false;

    /**
     * UC-30: Motion detection monitoring window start (e.g., "07:00").
     */
    @Column(length = 5)
    private String monitoringWindowStart;

    /**
     * UC-30: Motion detection monitoring window end (e.g., "09:00").
     */
    @Column(length = 5)
    private String monitoringWindowEnd;

    /**
     * UC-30: Whether motion detection alerts are enabled.
     */
    @Builder.Default
    private boolean motionDetectionEnabled = false;

    /**
     * UC-29: Auto snapshot schedule (e.g., "08:00,13:00,20:00").
     */
    @Column(length = 100)
    private String snapshotSchedule;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;

    public enum CameraStatus {
        ONLINE, OFFLINE, PRIVACY, ERROR
    }

    public boolean isOnline() {
        return status == CameraStatus.ONLINE && !privacyMode;
    }
}
