package com.carenest.backend.dto.family;

import com.carenest.backend.entity.AvailabilityStatus;
import com.carenest.backend.entity.FamilyLinkStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@Builder
public class FamilyLinkResponse {

    private Long id;
    private Long elderlyId;
    private String elderlyName;
    private Long familyId;
    private String familyName;
    private String relationship;
    private FamilyLinkStatus status;
    private AvailabilityStatus availabilityStatus;
    private OffsetDateTime createdAt;
}