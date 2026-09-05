package com.carenest.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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

@Entity
@Table(name = "medications")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"elderly", "createdAt", "updatedAt", "deletedAt"})
public class Medication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "elderly_id", nullable = false)
    private User elderly;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 100)
    private String dosage;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "schedule")
    private MedicationSchedule schedule;

    @Column(name = "next_dose_time")
    private OffsetDateTime nextDoseTime;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    /**
     * @deprecated Prescription-photo / OCR entry was dropped in Master Spec v3.5
     * (unreliable handwriting recognition for health data). The column is kept so
     * existing rows are not lost, but it is no longer written or exposed via the API.
     * Medication schedules are now entered by typing or voice-to-text.
     */
    @Deprecated
    @Column(name = "photo_url", length = 512)
    private String photoUrl;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;
}