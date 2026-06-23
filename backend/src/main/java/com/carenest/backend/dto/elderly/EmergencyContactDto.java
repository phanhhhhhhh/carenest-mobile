package com.carenest.backend.dto.elderly;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyContactDto {

    @NotBlank
    private String name;

    @NotBlank
    private String phone;

    private String relationship;
}
