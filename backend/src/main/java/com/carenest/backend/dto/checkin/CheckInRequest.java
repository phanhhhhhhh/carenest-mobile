package com.carenest.backend.dto.checkin;

import com.carenest.backend.entity.CheckInSource;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckInRequest {

    @NotNull(message = "mood is required")
    @Min(value = 1, message = "mood must be between 1 and 3")
    @Max(value = 3, message = "mood must be between 1 and 3")
    private Short mood;

    private String note;

    /** Optional; defaults to BUTTON when omitted. */
    private CheckInSource source;
}
