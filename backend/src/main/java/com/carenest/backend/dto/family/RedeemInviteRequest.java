package com.carenest.backend.dto.family;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RedeemInviteRequest {

    @NotBlank(message = "token is required")
    private String token;

    private String relationship;
}
