package com.carenest.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * UC-10: Stores Google Fit OAuth tokens per user.
 * Replaces the previous in-memory HashMap storage.
 */
@Entity
@Table(name = "google_fit_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoogleFitToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The user (elderly) this token belongs to.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /**
     * Google Fit OAuth access token.
     */
    @Column(name = "access_token", length = 2048)
    private String accessToken;

    /**
     * Google Fit OAuth refresh token (long-lived, used to get new access tokens).
     */
    @Column(name = "refresh_token", length = 512)
    private String refreshToken;

    /**
     * When the access token expires.
     */
    @Column(name = "expires_at")
    private Instant expiresAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
