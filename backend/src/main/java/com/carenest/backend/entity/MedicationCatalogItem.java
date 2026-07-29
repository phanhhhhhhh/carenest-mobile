package com.carenest.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "medication_catalog")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicationCatalogItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "brand_names", length = 300)
    private String brandNames;

    @Column(name = "dosage_form", nullable = false, length = 50)
    private String dosageForm;

    @Column(name = "common_strengths", length = 150)
    private String commonStrengths;

    @Column(nullable = false, length = 30)
    private String category;

    @Column(name = "atc_code", length = 10)
    private String atcCode;

    @Column(name = "usage_note", length = 300)
    private String usageNote;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
