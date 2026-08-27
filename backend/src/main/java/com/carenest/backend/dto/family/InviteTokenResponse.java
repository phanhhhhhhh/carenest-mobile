package com.carenest.backend.dto.family;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InviteTokenResponse {

    private String token;
    private OffsetDateTime expiresAt;
}
