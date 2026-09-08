package com.carenest.backend.dto.admin;

import java.util.List;

/** A single user with their related records, for the admin user drawer. */
public record AdminUserDetailResponse(
    AdminUserResponse user,
    AdminElderlyResponse elderlyProfile,
    AdminSubscriptionResponse activeSubscription,
    boolean groupPremium,
    List<AdminFamilyLinkResponse> familyLinks
) {}
