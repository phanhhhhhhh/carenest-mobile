package com.carenest.backend.dto.elderly;

import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.List;

@Getter
@Builder
public class ElderlyProfileResponse {

    private Long id;
    private Long userId;
    private String userName;
    private List<String> healthConditions;
    private List<EmergencyContactDto> emergencyContacts;
    private String notes;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
