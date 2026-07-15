package com.carenest.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;


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

    
    @Column(nullable = false, length = 100)
    private String label;

    
    @Column(name = "device_sn", nullable = false, length = 64)
    private String deviceSn;

    
    @Column(name = "device_id", length = 64)
    private String deviceId;

    
    @Column(name = "access_token", length = 512)
    private String accessToken;

    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private CameraStatus status = CameraStatus.OFFLINE;

    
    private Instant lastSeenAt;

    
    @Builder.Default
    private boolean privacyMode = false;

    
    @Column(length = 5)
    private String monitoringWindowStart;

    
    @Column(length = 5)
    private String monitoringWindowEnd;

    
    @Builder.Default
    private boolean motionDetectionEnabled = false;

    
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
