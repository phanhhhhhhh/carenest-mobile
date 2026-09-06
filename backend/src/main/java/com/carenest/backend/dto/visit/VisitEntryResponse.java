package com.carenest.backend.dto.visit;

import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

/** One confirmed visit in the Visit Streak history (UC A7). */
@Getter
@Builder
public class VisitEntryResponse {

    private Long id;
    private Long memberId;
    private String memberName;
    private OffsetDateTime visitedAt;
    private String note;
}
