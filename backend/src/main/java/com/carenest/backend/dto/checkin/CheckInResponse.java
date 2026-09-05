package com.carenest.backend.dto.checkin;

import com.carenest.backend.entity.CheckInSource;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@Builder
public class CheckInResponse {

    private Long id;
    private Long elderlyId;
    private Short mood;
    private String note;
    private CheckInSource source;
    private OffsetDateTime createdAt;
}
