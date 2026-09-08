package com.carenest.backend.dto.admin;

import com.carenest.backend.entity.CheckIn;

import java.time.OffsetDateTime;

public record AdminCheckInResponse(
    Long id,
    Long elderlyId,
    String elderlyName,
    Integer mood,
    String source,
    String note,
    OffsetDateTime createdAt
) {
    public static AdminCheckInResponse from(CheckIn c) {
        return new AdminCheckInResponse(
            c.getId(),
            c.getElderly() != null ? c.getElderly().getId() : null,
            c.getElderly() != null ? c.getElderly().getName() : null,
            c.getMood() != null ? c.getMood().intValue() : null,
            c.getSource() != null ? c.getSource().name() : null,
            c.getNote(),
            c.getCreatedAt()
        );
    }
}
