package com.carenest.backend.dto.visit;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfirmVisitRequest {

    @Size(max = 500, message = "note must be at most 500 characters")
    private String note;

    /** Optional back-dated visit time; defaults to now when omitted. */
    private OffsetDateTime visitedAt;
}
