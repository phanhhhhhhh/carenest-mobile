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
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"passwordHash", "emailVerificationToken", "pin", "createdAt", "updatedAt", "deletedAt"})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role;

    @Column(unique = true, length = 20)
    private String phone;

    
    @Column(length = 255, unique = true)
    private String email;

    @Column(nullable = false, length = 100)
    private String name;

    private LocalDate dob;

    
    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    
    @Column(name = "email_verified", nullable = false)
    @Builder.Default
    private boolean emailVerified = false;

    
    @Column(name = "email_verification_token", length = 128)
    private String emailVerificationToken;

    
    @Column(name = "email_verification_expiry")
    private OffsetDateTime emailVerificationExpiry;

    
    @Column(length = 255)
    private String pin;

    @Column(name = "fcm_token", length = 255)
    private String fcmToken;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "notification_preferences")
    @Builder.Default
    private NotificationPreferences notificationPreferences = new NotificationPreferences();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    
    public boolean isActive() {
        return deletedAt == null && emailVerified;
    }
}
