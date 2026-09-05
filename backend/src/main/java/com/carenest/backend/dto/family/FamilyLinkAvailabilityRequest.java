package com.carenest.backend.dto.family;

import com.carenest.backend.entity.AvailabilityStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FamilyLinkAvailabilityRequest {

    @NotNull(message = "availabilityStatus is required")
    private AvailabilityStatus availabilityStatus;
}
