package com.carenest.backend.dto.emergency;

import com.carenest.backend.entity.EmergencyStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Builder
public class EmergencyEventResponse {

    private Long id;
    private Long elderlyId;
    private String elderlyName;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String address;
    private String type;
    private String description;
    private EmergencyStatus status;
    private OffsetDateTime triggeredAt;
    private OffsetDateTime resolvedAt;
    private OffsetDateTime acknowledgedAt;
    private Long acknowledgedBy;
    private String acknowledgedByName;
    private Integer escalationLevel;
    private OffsetDateTime escalatedAt;
    private OffsetDateTime emergencyCallLoggedAt;
    private Long emergencyCallLoggedBy;
    private String emergencyCallLoggedByName;
    private String notes;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}