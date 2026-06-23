package com.carenest.backend.dto.elderly;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ElderlyProfileRequest {

    @NotNull(message = "userId không được để trống")
    private Long userId;

    private List<String> healthConditions;

    private List<EmergencyContactDto> emergencyContacts;

    private String notes;
}
