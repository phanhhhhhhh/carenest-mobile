package com.carenest.backend.dto.family;

import com.carenest.backend.entity.FamilyLinkStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@Builder
public class FamilyElderlyResponse {

    private Long linkId;
    private Long elderlyId;
    private String elderlyName;
    private String elderlyPhone;
    private String relationship;
    private FamilyLinkStatus status;
    private OffsetDateTime createdAt;
}
