package com.carenest.backend.dto.digest;

import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

/** One stored AI Family Digest (UC A6). */
@Getter
@Builder
public class DailyDigestResponse {

    private Long id;
    private String title;
    private String body;
    private String date;
    private boolean quietDay;
    private OffsetDateTime createdAt;
}
