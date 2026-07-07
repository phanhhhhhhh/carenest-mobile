package com.carenest.backend.service;

import com.carenest.backend.entity.FamilyLinkStatus;
import com.carenest.backend.entity.Subscription;
import com.carenest.backend.repository.FamilyLinkRepository;
import com.carenest.backend.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * UC-25: Subscription and tier enforcement service.
 * Handles feature gating based on subscription plan.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final FamilyLinkRepository familyLinkRepository;

    /**
     * UC-25: Check if a family member can add another elderly profile.
     * Free tier: max 1 elderly. Premium: unlimited.
     *
     * @param familyId the family user ID
     * @return true if the family can add another elderly, false if limit reached
     */
    @Transactional(readOnly = true)
    public boolean canAddElderly(Long familyId) {
        // Check if user has an active premium subscription
        boolean isPremium = subscriptionRepository
            .findByUserIdAndStatusAndPlanTypeIn(
                familyId,
                Subscription.SubscriptionStatus.ACTIVE,
                List.of(Subscription.PlanType.PREMIUM_MONTHLY, Subscription.PlanType.PREMIUM_YEARLY)
            )
            .map(Subscription::isPremium)
            .orElse(false);

        if (isPremium) {
            return true; // Premium: unlimited elderly
        }

        // Free tier: count currently linked ACTIVE elderly
        long activeElderlyCount = familyLinkRepository
            .findAllElderlyByFamilyIdAndStatus(familyId, FamilyLinkStatus.ACTIVE)
            .size();

        if (activeElderlyCount >= 1) {
            log.info("Free tier limit reached for familyId={}: {} active elderly linked", familyId, activeElderlyCount);
            return false;
        }

        return true;
    }

    /**
     * Get the maximum number of elderly profiles allowed for a family member.
     *
     * @param familyId the family user ID
     * @return max profiles allowed (1 for free, Integer.MAX_VALUE for premium)
     */
    @Transactional(readOnly = true)
    public int getMaxElderlyProfiles(Long familyId) {
        boolean isPremium = subscriptionRepository
            .findByUserIdAndStatusAndPlanTypeIn(
                familyId,
                Subscription.SubscriptionStatus.ACTIVE,
                List.of(Subscription.PlanType.PREMIUM_MONTHLY, Subscription.PlanType.PREMIUM_YEARLY)
            )
            .map(Subscription::isPremium)
            .orElse(false);

        return isPremium ? Integer.MAX_VALUE : 1;
    }

    /**
     * Get the number of currently linked active elderly for a family member.
     */
    @Transactional(readOnly = true)
    public int getActiveElderlyCount(Long familyId) {
        return familyLinkRepository
            .findAllElderlyByFamilyIdAndStatus(familyId, FamilyLinkStatus.ACTIVE)
            .size();
    }
}
