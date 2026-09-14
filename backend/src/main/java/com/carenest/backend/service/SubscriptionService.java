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

import java.util.ArrayList;
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

    private static final List<Subscription.PlanType> PREMIUM_PLANS =
        List.of(Subscription.PlanType.PREMIUM_MONTHLY, Subscription.PlanType.PREMIUM_YEARLY);

    /**
     * True when any of {@code userIds} has a Premium subscription that is still valid —
     * i.e. row status ACTIVE <em>and</em> {@link Subscription#isPremium()} (which also
     * checks {@code endDate}). A bare status filter is not enough: nothing in the app
     * currently transitions a lapsed subscription to EXPIRED, so {@code endDate} is the
     * real expiry gate.
     */
    private boolean anyActivePremium(List<Long> userIds) {
        if (userIds.isEmpty()) return false;
        return subscriptionRepository
            .findByUserIdInAndStatusAndPlanTypeIn(
                userIds, Subscription.SubscriptionStatus.ACTIVE, PREMIUM_PLANS)
            .stream()
            .anyMatch(Subscription::isPremium);
    }

    public static final int FREE_MAX_ELDERLY = 1;
    public static final int PREMIUM_MAX_ELDERLY = 4;

    public static final int FREE_MAX_FAMILY = 1;
    public static final int PREMIUM_MAX_FAMILY = 6;

    /** True when the user has an active CareNest Family Plus (Premium) subscription. */
    @Transactional(readOnly = true)
    public boolean isPremium(Long userId) {
        if (userId == null) return false;

        boolean direct = subscriptionRepository
            .findTopByUserIdAndStatusAndPlanTypeInOrderByEndDateDesc(
                userId, Subscription.SubscriptionStatus.ACTIVE, PREMIUM_PLANS)
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

        return anyActivePremium(familyIdsInGroup);
    }

    /**
     * Premium status from an <em>elderly</em> user's point of view: true when the elderly
     * has a direct Premium plan, or any family member actively linked to them does
     * (group-shared premium). Used for elderly-facing gates such as the AI chat quota,
     * where {@link #isPremium(Long)} — which resolves the group family-&gt;elderly — would
     * always see an elderly id as uncovered.
     */
    @Transactional(readOnly = true)
    public boolean isPremiumForElderly(Long elderlyId) {
        if (elderlyId == null) return false;

        List<Long> groupUserIds = new ArrayList<>();
        groupUserIds.add(elderlyId);
        familyLinkRepository
            .findAllFamilyByElderlyIdAndStatus(elderlyId, FamilyLinkStatus.ACTIVE)
            .forEach(fl -> groupUserIds.add(fl.getFamily().getId()));

        return anyActivePremium(groupUserIds);
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

        return anyActivePremium(linkedFamilyIds) ? PREMIUM_MAX_FAMILY : FREE_MAX_FAMILY;
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