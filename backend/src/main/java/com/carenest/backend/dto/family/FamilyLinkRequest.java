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

    @NotNull(message = "elderlyId không được để trống")
    private Long elderlyId;

    @NotNull(message = "familyId không được để trống")
    private Long familyId;

    @NotBlank(message = "relationship không được để trống")
    private String relationship;
}