package com.carenest.backend.service;

import com.carenest.backend.entity.AvailabilityStatus;
import com.carenest.backend.entity.BroadcastStatus;
import com.carenest.backend.entity.BroadcastTriggerType;
import com.carenest.backend.entity.FamilyBroadcast;
import com.carenest.backend.entity.FamilyLink;
import com.carenest.backend.entity.FamilyLinkStatus;
import com.carenest.backend.entity.NotificationType;
import com.carenest.backend.entity.User;
import com.carenest.backend.dto.family.FamilyBroadcastResponse;
import com.carenest.backend.exception.NotFoundException;
import com.carenest.backend.repository.FamilyBroadcastRepository;
import com.carenest.backend.repository.FamilyLinkRepository;
import com.carenest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Sequential "Free Broadcast" for daily attention events (UC A3) plus the
 * whole-family escalation (UC A4). Pages ONE free family member at a time,
 * oldest-notified first; {@link BroadcastEscalationScheduler} advances the
 * sequence. Never used for SOS — that path fans out to everyone immediately.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class NotificationBroadcastService {

    private final FamilyBroadcastRepository broadcastRepository;
    private final FamilyLinkRepository familyLinkRepository;
    private final UserRepository userRepository;
    private final FcmService fcmService;
    private final NotificationService notificationService;

    @Value("${carenest.broadcast.escalate-timeout-minutes:120}")
    private long escalateTimeoutMinutes;

    /**
     * Begins a sequential broadcast. If no family member is FREE (or there is no
     * family at all with a FREE slot), it escalates to everyone straight away.
     */
    public FamilyBroadcast startDailyBroadcast(Long elderlyId, BroadcastTriggerType triggerType,
                                               Long triggerRef, String title, String body) {
        User elderly = userRepository.findById(elderlyId)
            .orElseThrow(() -> new NotFoundException("User (elderly) not found: " + elderlyId));

        List<FamilyLink> activeLinks = familyLinkRepository
            .findAllFamilyByElderlyIdAndStatus(elderlyId, FamilyLinkStatus.ACTIVE);

        FamilyBroadcast broadcast = broadcastRepository.save(FamilyBroadcast.builder()
            .elderlyId(elderlyId)
            .triggerType(triggerType)
            .triggerRef(triggerRef)
            .title(title)
            .body(body)
            .status(BroadcastStatus.ACTIVE)
            .startedAt(OffsetDateTime.now())
            .build());

        List<FamilyLink> free = freeLinksOrdered(activeLinks);
        if (free.isEmpty()) {
            escalateToAll(broadcast, activeLinks, elderly.getName());
        } else {
            pageNext(broadcast, free.get(0), elderly.getName());
        }
        return broadcastRepository.save(broadcast);
    }

    /** A family member acknowledged — stop the sequence. */
    public FamilyBroadcast acknowledge(Long broadcastId, Long familyUserId) {
        FamilyBroadcast broadcast = broadcastRepository.findById(broadcastId)
            .orElseThrow(() -> new NotFoundException("Broadcast not found: " + broadcastId));

        if (broadcast.getStatus() == BroadcastStatus.ACKNOWLEDGED) {
            return broadcast;
        }

        broadcast.setStatus(BroadcastStatus.ACKNOWLEDGED);
        broadcast.setAcknowledgedAt(OffsetDateTime.now());
        broadcast.setAcknowledgedBy(familyUserId);

        familyLinkRepository
            .findByElderlyIdAndFamilyIdAndDeletedAtIsNull(broadcast.getElderlyId(), familyUserId)
            .ifPresent(link -> link.setLastAckAt(OffsetDateTime.now()));

        log.info("Broadcast {} acknowledged by userId={}", broadcastId, familyUserId);
        return broadcastRepository.save(broadcast);
    }

    /**
     * Scheduler entry point: the current recipient has not acked in time. Move to
     * the next FREE member, or escalate to the whole family once the list is
     * exhausted or {@code escalateTimeoutMinutes} have passed since it started.
     */
    public void advanceOrEscalate(FamilyBroadcast broadcast) {
        if (broadcast.getStatus() != BroadcastStatus.ACTIVE) {
            return;
        }

        User elderly = userRepository.findById(broadcast.getElderlyId()).orElse(null);
        String elderlyName = elderly != null ? elderly.getName() : "Người thân";

        List<FamilyLink> activeLinks = familyLinkRepository
            .findAllFamilyByElderlyIdAndStatus(broadcast.getElderlyId(), FamilyLinkStatus.ACTIVE);

        boolean overallTimeout = broadcast.getStartedAt() != null
            && Duration.between(broadcast.getStartedAt(), OffsetDateTime.now())
                .toMinutes() >= escalateTimeoutMinutes;

        Set<Long> alreadyPaged = parseNotified(broadcast.getNotifiedUserIds());
        List<FamilyLink> nextFree = freeLinksOrdered(activeLinks).stream()
            .filter(link -> !alreadyPaged.contains(link.getFamily().getId()))
            .collect(Collectors.toList());

        if (overallTimeout || nextFree.isEmpty()) {
            escalateToAll(broadcast, activeLinks, elderlyName);
        } else {
            pageNext(broadcast, nextFree.get(0), elderlyName);
        }
        broadcastRepository.save(broadcast);
    }

    // --- helpers -----------------------------------------------------------

    private List<FamilyLink> freeLinksOrdered(List<FamilyLink> activeLinks) {
        return activeLinks.stream()
            .filter(link -> link.getAvailabilityStatus() == AvailabilityStatus.FREE)
            .sorted(Comparator.comparing(FamilyLink::getLastNotifiedAt,
                Comparator.nullsFirst(Comparator.naturalOrder())))
            .collect(Collectors.toList());
    }

    private void pageNext(FamilyBroadcast broadcast, FamilyLink link, String elderlyName) {
        Long userId = link.getFamily().getId();
        OffsetDateTime now = OffsetDateTime.now();

        link.setLastNotifiedAt(now);
        broadcast.setCurrentRecipientId(userId);
        broadcast.setCurrentNotifiedAt(now);

        Set<Long> paged = parseNotified(broadcast.getNotifiedUserIds());
        paged.add(userId);
        broadcast.setNotifiedUserIds(paged.stream().map(String::valueOf).collect(Collectors.joining(",")));

        notify(List.of(userId), broadcast, elderlyName, false);
        log.info("Broadcast {} paged free member userId={}", broadcast.getId(), userId);
    }

    private void escalateToAll(FamilyBroadcast broadcast, List<FamilyLink> activeLinks, String elderlyName) {
        broadcast.setStatus(BroadcastStatus.ESCALATED);
        broadcast.setEscalatedAt(OffsetDateTime.now());
        broadcast.setCurrentRecipientId(null);

        List<Long> everyone = activeLinks.stream()
            .map(link -> link.getFamily().getId())
            .distinct()
            .collect(Collectors.toList());

        if (!everyone.isEmpty()) {
            notify(everyone, broadcast, elderlyName, true);
        }
        log.info("Broadcast {} escalated to {} family members", broadcast.getId(), everyone.size());
    }

    private void notify(List<Long> userIds, FamilyBroadcast broadcast, String elderlyName, boolean escalated) {
        Map<String, String> fcmData = Map.of(
            "type", escalated ? "FREE_BROADCAST_ESCALATED" : "FREE_BROADCAST",
            "broadcastId", broadcast.getId().toString(),
            "elderlyId", broadcast.getElderlyId().toString());
        fcmService.sendToUsers(userIds, broadcast.getTitle(), broadcast.getBody(), fcmData);

        notificationService.createForUsers(userIds, NotificationType.FAMILY_UPDATE,
            broadcast.getTitle(), broadcast.getBody(),
            Map.of(
                "type", escalated ? "FREE_BROADCAST_ESCALATED" : "FREE_BROADCAST",
                "broadcastId", broadcast.getId(),
                "elderlyId", broadcast.getElderlyId()));
    }

    private Set<Long> parseNotified(String csv) {
        Set<Long> out = new LinkedHashSet<>();
        if (csv == null || csv.isBlank()) {
            return out;
        }
        for (String part : csv.split(",")) {
            String trimmed = part.trim();
            if (!trimmed.isEmpty()) {
                out.add(Long.valueOf(trimmed));
            }
        }
        return out;
    }

    @Transactional(readOnly = true)
    public List<FamilyBroadcastResponse> getActiveForElderly(Long elderlyId) {
        List<FamilyBroadcast> rows = new ArrayList<>();
        rows.addAll(broadcastRepository.findByElderlyIdAndStatus(elderlyId, BroadcastStatus.ACTIVE));
        rows.addAll(broadcastRepository.findByElderlyIdAndStatus(elderlyId, BroadcastStatus.ESCALATED));
        rows.sort(Comparator.comparing(FamilyBroadcast::getStartedAt).reversed());
        return rows.stream().map(NotificationBroadcastService::toResponse).collect(Collectors.toList());
    }

    public FamilyBroadcastResponse acknowledgeAsResponse(Long broadcastId, Long familyUserId) {
        return toResponse(acknowledge(broadcastId, familyUserId));
    }

    private static FamilyBroadcastResponse toResponse(FamilyBroadcast b) {
        return FamilyBroadcastResponse.builder()
            .id(b.getId())
            .elderlyId(b.getElderlyId())
            .triggerType(b.getTriggerType())
            .title(b.getTitle())
            .body(b.getBody())
            .status(b.getStatus())
            .currentRecipientId(b.getCurrentRecipientId())
            .startedAt(b.getStartedAt())
            .acknowledgedAt(b.getAcknowledgedAt())
            .acknowledgedBy(b.getAcknowledgedBy())
            .escalatedAt(b.getEscalatedAt())
            .build();
    }

    /** Ids of check-ins (or other trigger rows) with an acknowledged broadcast — used by the feed. */
    @Transactional(readOnly = true)
    public Set<Long> acknowledgedTriggerRefs(Long elderlyId, BroadcastTriggerType triggerType, List<Long> refs) {
        if (refs == null || refs.isEmpty()) {
            return Set.of();
        }
        List<FamilyBroadcast> all = new ArrayList<>();
        all.addAll(broadcastRepository.findByElderlyIdAndStatus(elderlyId, BroadcastStatus.ACKNOWLEDGED));
        Set<Long> wanted = new LinkedHashSet<>(refs);
        return all.stream()
            .filter(b -> b.getTriggerType() == triggerType)
            .map(FamilyBroadcast::getTriggerRef)
            .filter(java.util.Objects::nonNull)
            .filter(wanted::contains)
            .collect(Collectors.toCollection(LinkedHashSet::new));
    }
}
