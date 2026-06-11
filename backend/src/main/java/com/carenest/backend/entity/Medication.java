package com.carenest.backend.entity;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
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
import org.hibernate.annotations.Type;
import org.hibernate.annotations.UpdateTimestamp;

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

    @Type(JsonBinaryType.class)
    @Column(name = "schedule", columnDefinition = "jsonb")
    private MedicationSchedule schedule;

    @Column(name = "next_dose_time")
    private OffsetDateTime nextDoseTime;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;
}
