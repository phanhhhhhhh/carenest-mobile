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


@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final FamilyLinkRepository familyLinkRepository;

    
    @Transactional(readOnly = true)
    public boolean canAddElderly(Long familyId) {
        boolean isPremium = subscriptionRepository
            .findByUserIdAndStatusAndPlanTypeIn(
                familyId,
                Subscription.SubscriptionStatus.ACTIVE,
                List.of(Subscription.PlanType.PREMIUM_MONTHLY, Subscription.PlanType.PREMIUM_YEARLY)
            )
            .map(s -> s.isPremium())
            .orElse(false);

        if (isPremium) {
            return true;
        }

        long activeElderlyCount = familyLinkRepository
            .findAllElderlyByFamilyIdAndStatus(familyId, FamilyLinkStatus.ACTIVE)
            .size();

        if (activeElderlyCount >= 1) {
            log.info("Free tier limit reached for familyId={}: {} active elderly linked", familyId, activeElderlyCount);
            return false;
        }

        return true;
    }

    
    @Transactional(readOnly = true)
    public int getMaxElderlyProfiles(Long familyId) {
        boolean isPremium = subscriptionRepository
            .findByUserIdAndStatusAndPlanTypeIn(
                familyId,
                Subscription.SubscriptionStatus.ACTIVE,
                List.of(Subscription.PlanType.PREMIUM_MONTHLY, Subscription.PlanType.PREMIUM_YEARLY)
            )
            .map(s -> s.isPremium())
            .orElse(false);

        return isPremium ? Integer.MAX_VALUE : 1;
    }


    @Transactional(readOnly = true)
    public int getActiveElderlyCount(Long familyId) {
        return familyLinkRepository
            .findAllElderlyByFamilyIdAndStatus(familyId, FamilyLinkStatus.ACTIVE)
            .size();
    }

    /** True when the user has an active CareNest Family Plus (Premium) subscription. */
    @Transactional(readOnly = true)
    public boolean isPremium(Long userId) {
        if (userId == null) {
            return false;
        }
        return subscriptionRepository
            .findByUserIdAndStatus(userId, Subscription.SubscriptionStatus.ACTIVE)
            .map(Subscription::isPremium)
            .orElse(false);
    }
}
