package com.carenest.backend.dto.family;

import com.carenest.backend.entity.AvailabilityStatus;
import com.carenest.backend.entity.FamilyLinkStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.List;

@Getter
@Builder
public class FamilyElderlyResponse {

    private Long linkId;
    private Long elderlyId;
    private String elderlyName;
    private String elderlyPhone;
    private String relationship;
    private FamilyLinkStatus status;
    /** This family member's own FREE/BUSY state for the selected elderly (UC A3). */
    private AvailabilityStatus availabilityStatus;
    private OffsetDateTime createdAt;
    private List<String> healthConditions;
}