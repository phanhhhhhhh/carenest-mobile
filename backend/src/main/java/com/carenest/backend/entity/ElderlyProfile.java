package com.carenest.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.List;

@Entity
@Table(name = "elderly_profiles")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"user", "createdAt", "updatedAt", "deletedAt"})
public class ElderlyProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "health_conditions")
    private List<String> healthConditions;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "emergency_contacts")
    private List<EmergencyContact> emergencyContacts;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "secondary_family_user_id")
    private User secondaryFamilyUser;

    @Column(columnDefinition = "TEXT")
    private String allergies;

    @Column(name = "blood_type", length = 10)
    private String bloodType;

    @Column(name = "weight_kg", precision = 5, scale = 2)
    private java.math.BigDecimal weightKg;

    @Column(name = "height_cm", precision = 5, scale = 1)
    private java.math.BigDecimal heightCm;

    @Column(columnDefinition = "TEXT")
    private String notes;

    /** Camera consent onboarding (UC D1). */
    @jakarta.persistence.Enumerated(jakarta.persistence.EnumType.STRING)
    @Column(name = "camera_consent_status", nullable = false, length = 12)
    @Builder.Default
    private CameraConsentStatus cameraConsentStatus = CameraConsentStatus.PENDING;

    @Column(name = "camera_consent_decided_at")
    private OffsetDateTime cameraConsentDecidedAt;

    /** When a declined consent becomes eligible for its single 30-day re-ask. */
    @Column(name = "camera_consent_retry_after")
    private OffsetDateTime cameraConsentRetryAfter;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;
}