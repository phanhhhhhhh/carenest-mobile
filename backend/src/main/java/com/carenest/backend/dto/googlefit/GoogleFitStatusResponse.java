package com.carenest.backend.dto.googlefit;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GoogleFitStatusResponse {
    private boolean connected;
    private boolean configured;
}
