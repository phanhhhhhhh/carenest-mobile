package com.carenest.backend.dto.family;

import com.carenest.backend.entity.FamilyLinkStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FamilyLinkStatusRequest {

    @NotNull(message = "status không được để trống")
    private FamilyLinkStatus status;
}