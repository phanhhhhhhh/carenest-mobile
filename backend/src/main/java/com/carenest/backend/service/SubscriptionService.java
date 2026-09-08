package com.carenest.backend.service;

import com.carenest.backend.entity.FamilyLink;
import com.carenest.backend.entity.FamilyLinkStatus;
import com.carenest.backend.entity.Subscription;
import com.carenest.backend.exception.PaymentRequiredException;
import com.carenest.backend.repository.FamilyLinkRepository;
import com.carenest.backend.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionService {

    public static final String PREMIUM_REQUIRED_MESSAGE =
        "An active CareNest Premium subscription is required to export PDF health reports.";

    private final SubscriptionRepository subscriptionRepository;
    private final FamilyLinkRepository familyLinkRepository;

    public static final int FREE_MAX_ELDERLY = 1;
    public static final int PREMIUM_MAX_ELDERLY = 4;

    public static final int FREE_MAX_FAMILY = 1;
    public static final int PREMIUM_MAX_FAMILY = 6;

    /** True when the user has an active CareNest Family Plus (Premium) subscription. */
    @Transactional(readOnly = true)
    public boolean isPremium(Long userId) {
        if (userId == null) return false;

        boolean direct = subscriptionRepository
            .findByUserIdAndStatusAndPlanTypeIn(
                userId,
                Subscription.SubscriptionStatus.ACTIVE,
                List.of(
                    Subscription.PlanType.PREMIUM_MONTHLY,
                    Subscription.PlanType.PREMIUM_YEARLY
                )
            )
            .map(Subscription::isPremium)
            .orElse(false);

        if (direct) return true;

        List<Long> linkedElderlyIds = familyLinkRepository
            .findAllElderlyByFamilyIdAndStatus(userId, FamilyLinkStatus.ACTIVE)
            .stream()
            .map(fl -> fl.getElderly().getId())
            .collect(Collectors.toList());

        if (linkedElderlyIds.isEmpty()) return false;

        List<Long> familyIdsInGroup = familyLinkRepository
            .findAllFamilyByElderlyIdInAndStatus(linkedElderlyIds, FamilyLinkStatus.ACTIVE)
            .stream()
            .map(fl -> fl.getFamily().getId())
            .collect(Collectors.toList());

        if (familyIdsInGroup.isEmpty()) return false;

        return !subscriptionRepository
            .findByUserIdInAndStatusAndPlanTypeIn(
                familyIdsInGroup,
                Subscription.SubscriptionStatus.ACTIVE,
                List.of(Subscription.PlanType.PREMIUM_MONTHLY, Subscription.PlanType.PREMIUM_YEARLY)
            )
            .isEmpty();
    }

    @Transactional(readOnly = true)
    public boolean isPro(Long userId) {
        return false;
    }

    @Transactional(readOnly = true)
    public boolean isPremiumOrPro(Long userId) {
        return isPremium(userId);
    }

    @Transactional(readOnly = true)
    public int getMaxElderlyProfiles(Long familyId) {
        if (isPremium(familyId)) {
            return PREMIUM_MAX_ELDERLY;
        }
        return FREE_MAX_ELDERLY;
    }

    @Transactional(readOnly = true)
    public int getActiveElderlyCount(Long familyId) {
        return familyLinkRepository
            .findAllElderlyByFamilyIdAndStatus(familyId, FamilyLinkStatus.ACTIVE)
            .size();
    }

    /** True when the user has an active CareNest Family Plus (Premium) subscription. */
    @Transactional(readOnly = true)
    public void requirePremium(Long familyId) {
        if (!isPremium(familyId)) {
            throw new PaymentRequiredException(PREMIUM_REQUIRED_MESSAGE);
        }
    }

    @Transactional(readOnly = true)
    public boolean canAddElderly(Long familyId) {
        int max = getMaxElderlyProfiles(familyId);
        int current = getActiveElderlyCount(familyId);
        if (current >= max) {
            log.info("Elderly limit reached for familyId={}: {}/{} active elderly linked", familyId, current, max);
            return false;
        }
        return true;
    }

    @Transactional(readOnly = true)
    public int getMaxFamilyAccountsForElderly(Long elderlyId, Long candidateFamilyId) {
        if (isPremium(candidateFamilyId)) {
            return PREMIUM_MAX_FAMILY;
        }

        List<Long> linkedFamilyIds = familyLinkRepository
            .findAllFamilyByElderlyIdAndStatus(elderlyId, FamilyLinkStatus.ACTIVE)
            .stream()
            .map(fl -> fl.getFamily().getId())
            .collect(Collectors.toList());

        if (!linkedFamilyIds.isEmpty()) {
            boolean anyPremium = !subscriptionRepository
                .findByUserIdInAndStatusAndPlanTypeIn(
                    linkedFamilyIds,
                    Subscription.SubscriptionStatus.ACTIVE,
                    List.of(Subscription.PlanType.PREMIUM_MONTHLY, Subscription.PlanType.PREMIUM_YEARLY)
                )
                .isEmpty();

            if (anyPremium) {
                return PREMIUM_MAX_FAMILY;
            }
        }

        return FREE_MAX_FAMILY;
    }

    @Transactional(readOnly = true)
    public int getActiveFamilyCount(Long elderlyId) {
        return familyLinkRepository
            .findAllFamilyByElderlyIdAndStatus(elderlyId, FamilyLinkStatus.ACTIVE)
            .size();
    }

    @Transactional(readOnly = true)
    public boolean canAddFamilyMember(Long elderlyId, Long candidateFamilyId) {
        int max = getMaxFamilyAccountsForElderly(elderlyId, candidateFamilyId);
        int current = getActiveFamilyCount(elderlyId);
        if (current >= max) {
            log.info("Family member limit reached for elderlyId={}: {}/{} active family members linked", elderlyId, current, max);
            return false;
        }
        return true;
    }
}