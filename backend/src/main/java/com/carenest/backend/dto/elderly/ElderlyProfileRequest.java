package com.carenest.backend.dto.elderly;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ElderlyProfileRequest {

    private List<String> healthConditions;

    private List<EmergencyContactDto> emergencyContacts;

    private String allergies;

    private String bloodType;

    private BigDecimal weightKg;

    private BigDecimal heightCm;

    private String notes;
}