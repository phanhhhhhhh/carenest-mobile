package com.carenest.backend.service;

import com.carenest.backend.dto.feed.FeedItemResponse;
import com.carenest.backend.dto.feed.FeedReactionResponse;
import com.carenest.backend.entity.CheckIn;
import com.carenest.backend.entity.EmergencyEvent;
import com.carenest.backend.entity.FeedItemType;
import com.carenest.backend.entity.FeedReaction;
import com.carenest.backend.entity.MedicationLog;
import com.carenest.backend.entity.MedicationLogStatus;
import com.carenest.backend.entity.User;
import com.carenest.backend.exception.NotFoundException;
import com.carenest.backend.repository.CheckInRepository;
import com.carenest.backend.repository.EmergencyEventRepository;
import com.carenest.backend.repository.FeedReactionRepository;
import com.carenest.backend.repository.MedicationLogRepository;
import com.carenest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Builds the Family Care Feed (UC A2) — a single time-ordered timeline unioned
 * from check-ins, medication logs and emergency events. The feed only ever
 * exposes a generic "handled / not handled" state per item, never which family
 * member acted (spec 4.2), and lets family members "thả tim" on an item.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FamilyFeedService {

    /** How far back the feed looks. */
    private static final int WINDOW_DAYS = 21;
    private static final int DEFAULT_LIMIT = 50;
    private static final int MAX_LIMIT = 100;

    private final CheckInRepository checkInRepository;
    private final MedicationLogRepository medicationLogRepository;
    private final EmergencyEventRepository emergencyEventRepository;
    private final NotificationBroadcastService notificationBroadcastService;
    private final FeedReactionRepository feedReactionRepository;
    private final UserRepository userRepository;

    public List<FeedItemResponse> getFeed(Long elderlyId, Long viewerId, Integer limit) {
        int cap = limit == null ? DEFAULT_LIMIT : Math.min(Math.max(limit, 1), MAX_LIMIT);
        OffsetDateTime since = OffsetDateTime.now().minusDays(WINDOW_DAYS);
        OffsetDateTime now = OffsetDateTime.now();

        User elderly = userRepository.findById(elderlyId)
            .orElseThrow(() -> new NotFoundException("User (elderly) not found: " + elderlyId));
        String elderlyName = elderly.getName();

        List<Draft> drafts = new ArrayList<>();

        for (CheckIn c : checkInRepository
                .findByElderlyIdAndCreatedAtBetweenOrderByCreatedAtDesc(elderlyId, since, now)) {
            drafts.add(new Draft(FeedItemType.CHECK_IN, c.getId(), c.getCreatedAt(),
                "Đã báo tin: " + moodText(c.getMood()), moodSubtitle(c.getMood()),
                null)); // handled decided by reaction count
        }

        for (MedicationLog log : medicationLogRepository
                .findAllByElderlyIdAndDateRange(elderlyId, since, now)) {
            String medName = log.getMedication().getName();
            boolean taken = log.getStatus() == MedicationLogStatus.TAKEN;
            drafts.add(new Draft(FeedItemType.MEDICATION_LOG, log.getId(), log.getTakenAt(),
                medLogTitle(log.getStatus(), medName),
                log.getMedication().getDosage(),
                taken));
        }

        for (EmergencyEvent e : emergencyEventRepository.findByElderlyIdOrderByTriggeredAtDesc(elderlyId)) {
            if (e.getTriggeredAt() == null || e.getTriggeredAt().isBefore(since)) {
                continue;
            }
            drafts.add(new Draft(FeedItemType.EMERGENCY, e.getId(), e.getTriggeredAt(),
                "Tín hiệu khẩn cấp (SOS)",
                e.getAcknowledgedAt() != null ? "Đã có người tiếp nhận" : "Chưa ai xác nhận",
                e.getAcknowledgedAt() != null));
        }

        drafts.sort(Comparator.comparing((Draft d) -> d.occurredAt).reversed());
        if (drafts.size() > cap) {
            drafts = drafts.subList(0, cap);
        }

        Map<FeedItemType, List<Long>> refsByType = drafts.stream()
            .collect(Collectors.groupingBy(d -> d.type, Collectors.mapping(d -> d.ref, Collectors.toList())));

        Map<FeedItemType, Map<Long, Integer>> countsByType = new java.util.EnumMap<>(FeedItemType.class);
        Map<FeedItemType, Set<Long>> reactedByMe = new java.util.EnumMap<>(FeedItemType.class);

        for (Map.Entry<FeedItemType, List<Long>> entry : refsByType.entrySet()) {
            List<FeedReaction> reactions = feedReactionRepository
                .findByElderlyIdAndItemTypeAndItemRefIn(elderlyId, entry.getKey(), entry.getValue());
            Map<Long, Integer> counts = reactions.stream()
                .collect(Collectors.groupingBy(FeedReaction::getItemRef, Collectors.summingInt(r -> 1)));
            Set<Long> mine = reactions.stream()
                .filter(r -> r.getFamilyUser().getId().equals(viewerId))
                .map(FeedReaction::getItemRef)
                .collect(Collectors.toCollection(HashSet::new));
            countsByType.put(entry.getKey(), counts);
            reactedByMe.put(entry.getKey(), mine);
        }

        // A check-in also counts as "handled" if a family member acknowledged the
        // Free Broadcast it triggered (UC A3), not just if someone reacted.
        Set<Long> checkInIdsWithAckedBroadcast = notificationBroadcastService.acknowledgedTriggerRefs(
            elderlyId, com.carenest.backend.entity.BroadcastTriggerType.CHECK_IN_UNWELL,
            refsByType.getOrDefault(FeedItemType.CHECK_IN, List.of()));

        List<FeedItemResponse> out = new ArrayList<>(drafts.size());
        for (Draft d : drafts) {
            int count = countsByType.getOrDefault(d.type, Map.of()).getOrDefault(d.ref, 0);
            boolean mine = reactedByMe.getOrDefault(d.type, Set.of()).contains(d.ref);
            boolean handled = d.handledOverride != null
                ? d.handledOverride
                : count > 0
                    || (d.type == FeedItemType.CHECK_IN && checkInIdsWithAckedBroadcast.contains(d.ref));
            out.add(FeedItemResponse.builder()
                .id(d.type.name() + ":" + d.ref)
                .type(d.type)
                .itemRef(d.ref)
                .elderlyId(elderlyId)
                .elderlyName(elderlyName)
                .occurredAt(d.occurredAt)
                .title(d.title)
                .subtitle(d.subtitle)
                .handled(handled)
                .reactionCount(count)
                .reactedByMe(mine)
                .build());
        }
        return out;
    }

    @Transactional
    public FeedReactionResponse toggleReaction(Long elderlyId, Long familyUserId, FeedItemType itemType, Long itemRef) {
        validateItemBelongsToElderly(elderlyId, itemType, itemRef);

        var existing = feedReactionRepository
            .findByItemTypeAndItemRefAndFamilyUserId(itemType, itemRef, familyUserId);

        boolean reacted;
        if (existing.isPresent()) {
            feedReactionRepository.delete(existing.get());
            reacted = false;
        } else {
            feedReactionRepository.save(FeedReaction.builder()
                .elderly(userRepository.getReferenceById(elderlyId))
                .familyUser(userRepository.getReferenceById(familyUserId))
                .itemType(itemType)
                .itemRef(itemRef)
                .build());
            reacted = true;
        }
        feedReactionRepository.flush();

        int count = feedReactionRepository
            .findByElderlyIdAndItemTypeAndItemRefIn(elderlyId, itemType, List.of(itemRef))
            .size();
        boolean handled = itemType == FeedItemType.CHECK_IN ? count > 0 : reacted || count > 0;

        return FeedReactionResponse.builder()
            .reacted(reacted)
            .reactionCount(count)
            .handled(handled)
            .build();
    }

    private void validateItemBelongsToElderly(Long elderlyId, FeedItemType itemType, Long itemRef) {
        boolean ok = switch (itemType) {
            case CHECK_IN -> checkInRepository.findById(itemRef)
                .map(c -> c.getElderly().getId().equals(elderlyId)).orElse(false);
            case MEDICATION_LOG -> medicationLogRepository.findById(itemRef)
                .map(l -> l.getMedication().getElderly().getId().equals(elderlyId)).orElse(false);
            case EMERGENCY -> emergencyEventRepository.findById(itemRef)
                .map(e -> e.getElderly().getId().equals(elderlyId)).orElse(false);
        };
        if (!ok) {
            throw new NotFoundException("Feed item not found for this elderly: " + itemType + ":" + itemRef);
        }
    }

    private static String moodText(Short mood) {
        if (mood == null) {
            return "bình thường";
        }
        return switch (mood.intValue()) {
            case 1 -> "khỏe mạnh 😊";
            case 2 -> "bình thường 😐";
            case 3 -> "thấy mệt 😣";
            case 4 -> "cần giúp gấp 🆘";
            default -> "bình thường";
        };
    }

    private static String moodSubtitle(Short mood) {
        if (mood != null && mood.intValue() == 3) {
            return "Nên hỏi thăm ông/bà một chút";
        }
        if (mood != null && mood.intValue() == 4) {
            return "Đã kích hoạt cảnh báo khẩn cấp";
        }
        return "Chạm trái tim để ông/bà biết cả nhà đã đọc";
    }

    private static String medLogTitle(MedicationLogStatus status, String medName) {
        return switch (status) {
            case TAKEN -> "Đã uống " + medName;
            case MISSED -> "Bỏ lỡ liều " + medName;
            case SKIPPED -> "Bỏ qua liều " + medName;
        };
    }

    /** Mutable working row before reaction counts are folded in. */
    private static final class Draft {
        final FeedItemType type;
        final Long ref;
        final OffsetDateTime occurredAt;
        final String title;
        final String subtitle;
        final Boolean handledOverride;

        Draft(FeedItemType type, Long ref, OffsetDateTime occurredAt,
              String title, String subtitle, Boolean handledOverride) {
            this.type = type;
            this.ref = ref;
            this.occurredAt = occurredAt;
            this.title = title;
            this.subtitle = subtitle;
            this.handledOverride = handledOverride;
        }
    }
}
