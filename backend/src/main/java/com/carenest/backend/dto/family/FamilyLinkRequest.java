package com.carenest.backend.dto.family;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FamilyLinkRequest {

    @NotNull(message = "elderlyId is required")
    private Long elderlyId;

    @NotNull(message = "familyId is required")
    private Long familyId;

    @NotBlank(message = "relationship is required")
    private String relationship;
}