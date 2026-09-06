package com.carenest.backend.service;

import com.carenest.backend.dto.chat.ChatHistoryResponse;
import com.carenest.backend.dto.chat.ChatRequest;
import com.carenest.backend.dto.chat.ChatResponse;
import com.carenest.backend.exception.GeminiApiException;
import com.carenest.backend.exception.PaymentRequiredException;
import com.carenest.backend.entity.*;
import com.carenest.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final GeminiApiService geminiApiService;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final ElderlyProfileRepository elderlyProfileRepository;
    private final HealthMetricRepository healthMetricRepository;
    private final MedicationRepository medicationRepository;
    private final AppointmentRepository appointmentRepository;
    private final FamilyLinkRepository familyLinkRepository;
    private final SubscriptionService subscriptionService;

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm 'on' EEEE, MMM d");
    private static final ZoneId ICT = ZoneId.of("Asia/Ho_Chi_Minh");

    /** Free-plan companion-chat allowance per day (UC A5 / G3). */
    @Value("${carenest.chat.free-daily-limit:5}")
    private int freeDailyLimit;

    /** Fairly unambiguous emergency phrasings — steer these to SOS, don't chat. */
    private static final List<String> EMERGENCY_PHRASES = List.of(
        "cấp cứu", "gọi 115", "khó thở", "đau ngực", "đau tim", "đột quỵ", "tai biến",
        "bất tỉnh", "ngất xỉu", "chảy máu nhiều", "té ngã", "bị ngã không dậy được",
        "emergency", "call an ambulance", "can't breathe", "cannot breathe", "chest pain",
        "i'm dying", "help me now");

    
    @Transactional
    public ChatResponse sendMessage(Long userId, ChatRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new com.carenest.backend.exception.NotFoundException("User not found"));

        String sessionId = request.getSessionId() != null
            ? request.getSessionId()
            : "default-" + userId;

        boolean premium = subscriptionService.isPremium(userId);
        Instant startOfDay = LocalDate.now(ICT).atStartOfDay(ICT).toInstant();
        long usedToday = chatMessageRepository.countByUserIdAndRoleAndCreatedAtAfter(
            userId, ChatMessage.ChatRole.USER, startOfDay);

        // UC A5 alt-flow: an emergency-sounding message is steered to the dedicated
        // SOS action rather than answered as ordinary companion chat. It does not
        // consume the free daily allowance.
        if (looksLikeEmergency(request.getMessage())) {
            saveUserMessage(user, request.getMessage(), sessionId);
            String steer = "Nếu đây là trường hợp khẩn cấp, hãy bấm ngay nút SOS màu đỏ trên màn hình "
                + "chính để báo cho cả nhà, hoặc gọi 115. Trợ lý AI không thay thế được cấp cứu.";
            ChatMessage aiMsg = saveAiMessage(user, steer, "EMERGENCY", buildContextData(user), sessionId);
            return response(aiMsg, steer, "EMERGENCY", sessionId,
                premium ? null : (int) Math.max(0, freeDailyLimit - usedToday));
        }

        // UC A5 / G3: the free plan gets ~5 companion messages per day; Family Plus is unlimited.
        if (!premium && usedToday >= freeDailyLimit) {
            throw new PaymentRequiredException("Bạn đã dùng hết " + freeDailyLimit
                + " lượt trò chuyện miễn phí với trợ lý AI hôm nay. Nâng cấp CareNest Family Plus "
                + "để trò chuyện không giới hạn.");
        }

        saveUserMessage(user, request.getMessage(), sessionId);

        String systemPrompt = buildSystemPrompt(user);
        String conversationHistory = buildConversationContext(userId);

        String fullPrompt = conversationHistory + "\nElderly: " + request.getMessage();

        String aiResponse;
        String intent;
        try {
            aiResponse = geminiApiService.generateConversational(systemPrompt, fullPrompt);
            intent = classifyIntent(aiResponse);
        } catch (GeminiApiException e) {
            // Gemini failed (missing/invalid key, timeout, safety block, malformed response).
            // Persist and return a clearly-flagged error turn instead of silently treating
            // GeminiApiService's failure as a genuine AI reply.
            log.warn("Gemini API call failed for elderly chat (userId={}): {}", userId, e.getMessage());
            aiResponse = "Không thể kết nối với trợ lý AI lúc này, vui lòng thử lại.";
            intent = "ERROR";
        }

        ChatMessage aiMsg = saveAiMessage(user, aiResponse, intent, buildContextData(user), sessionId);

        Integer remaining = premium ? null : (int) Math.max(0, freeDailyLimit - (usedToday + 1));
        return response(aiMsg, aiResponse, intent, sessionId, remaining);
    }

    private ChatMessage saveUserMessage(User user, String content, String sessionId) {
        return chatMessageRepository.save(ChatMessage.builder()
            .user(user)
            .role(ChatMessage.ChatRole.USER)
            .content(content)
            .sessionId(sessionId)
            .build());
    }

    private ChatMessage saveAiMessage(User user, String content, String intent,
                                      Map<String, Object> contextData, String sessionId) {
        return chatMessageRepository.save(ChatMessage.builder()
            .user(user)
            .role(ChatMessage.ChatRole.AI)
            .content(content)
            .intent(intent)
            .contextData(contextData)
            .sessionId(sessionId)
            .build());
    }

    private ChatResponse response(ChatMessage aiMsg, String content, String intent,
                                  String sessionId, Integer remainingFreeMessages) {
        return ChatResponse.builder()
            .messageId(aiMsg.getId())
            .role("AI")
            .content(content)
            .intent(intent)
            .sessionId(sessionId)
            .createdAt(aiMsg.getCreatedAt())
            .remainingFreeMessages(remainingFreeMessages)
            .build();
    }

    private static boolean looksLikeEmergency(String message) {
        if (message == null || message.isBlank()) {
            return false;
        }
        String lower = message.toLowerCase(Locale.ROOT);
        return EMERGENCY_PHRASES.stream().anyMatch(lower::contains);
    }

    
    @Transactional(readOnly = true)
    public ChatHistoryResponse getHistory(Long userId, String sessionId, int page, int size) {
        Page<ChatMessage> messages;
        if (sessionId != null && !sessionId.isBlank()) {
            messages = chatMessageRepository.findByUserIdAndSessionIdOrderByCreatedAtDesc(
                userId, sessionId, PageRequest.of(page, size));
        } else {
            messages = chatMessageRepository.findByUserIdOrderByCreatedAtDesc(
                userId, PageRequest.of(page, size));
        }

        List<ChatResponse> responses = messages.getContent().stream()
            .map(m -> ChatResponse.builder()
                .messageId(m.getId())
                .role(m.getRole().name())
                .content(m.getContent())
                .intent(m.getIntent())
                .sessionId(m.getSessionId())
                .createdAt(m.getCreatedAt())
                .build())
            .collect(Collectors.toList());
        Collections.reverse(responses);

        return ChatHistoryResponse.builder()
            .messages(responses)
            .page(page)
            .size(size)
            .totalMessages(messages.getTotalElements())
            .hasMore(messages.hasNext())
            .build();
    }

    
    @Transactional
    public void clearHistory(Long userId) {
        chatMessageRepository.deleteByUserId(userId);
        log.info("Chat history cleared for user {}", userId);
    }


    private String buildSystemPrompt(User user) {
        StringBuilder prompt = new StringBuilder();

        prompt.append("You are a warm, caring AI companion for an elderly person named ");
        prompt.append(user.getName()).append(".\n\n");

        ZonedDateTime now = ZonedDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        prompt.append("Current time: ").append(now.format(DateTimeFormatter.ofPattern("HH:mm 'on' EEEE, MMM d, yyyy"))).append(".\n");

        String timeOfDay = getTimeOfDayGreeting(now.getHour());
        prompt.append("It is ").append(timeOfDay).append(". Greet them appropriately.\n\n");

        prompt.append("=== YOUR PERSONALITY & RULES ===\n");
        prompt.append("1. Use simple, warm Vietnamese or English (match the elderly's language) with large-font friendly tone.\n");
        prompt.append("2. You are NOT a doctor. Never diagnose or prescribe. Always add: 'Please consult your doctor for medical advice.'\n");
        prompt.append("3. If they ask about their health, use the provided health data to give friendly observations.\n");
        prompt.append("4. If they ask about medications, check the medication list and remind them.\n");
        prompt.append("5. If they seem lonely or sad, provide companionship — tell stories, ask about their day, share wisdom.\n");
        prompt.append("6. Keep responses concise (2-4 sentences) unless they ask for details.\n");
        prompt.append("7. Call them by their name to be personal.\n\n");

        appendHealthContext(prompt, user);
        appendMedicationContext(prompt, user);
        appendAppointmentContext(prompt, user);
        appendFamilyContext(prompt, user);

        return prompt.toString();
    }

    private void appendHealthContext(StringBuilder prompt, User user) {
        var profileOpt = elderlyProfileRepository.findByUserIdAndDeletedAtIsNull(user.getId());
        if (profileOpt.isEmpty()) return;

        var profile = profileOpt.get();
        prompt.append("=== ELDERLY HEALTH PROFILE ===\n");
        if (profile.getHealthConditions() != null && !profile.getHealthConditions().isEmpty()) {
            prompt.append("Chronic conditions: ").append(String.join(", ", profile.getHealthConditions())).append("\n");
        }
        if (profile.getAllergies() != null && !profile.getAllergies().isBlank()) {
            prompt.append("Allergies: ").append(profile.getAllergies()).append("\n");
        }
        if (profile.getBloodType() != null) {
            prompt.append("Blood type: ").append(profile.getBloodType()).append("\n");
        }

        List<HealthMetric> latestMetrics = healthMetricRepository.findByElderlyIdAndDeletedAtIsNullOrderByRecordedAtDesc(user.getId());
        if (!latestMetrics.isEmpty()) {
            prompt.append("Recent health metrics:\n");
            Set<HealthMetricType> seen = new HashSet<>();
            for (HealthMetric m : latestMetrics) {
                if (seen.add(m.getType()) && seen.size() <= 6) {
                    prompt.append("  - ").append(m.getType().name().replace("_", " "))
                        .append(": ").append(m.getValue()).append(" ").append(m.getUnit())
                        .append(" (recorded ").append(m.getRecordedAt().atZoneSameInstant(ZoneId.of("Asia/Ho_Chi_Minh")).format(TIME_FMT)).append(")\n");
                }
            }
        }
        prompt.append("\n");
    }

    private void appendMedicationContext(StringBuilder prompt, User user) {
        List<Medication> meds = medicationRepository.findByElderlyIdAndDeletedAtIsNull(user.getId());
        if (meds.isEmpty()) return;

        prompt.append("=== CURRENT MEDICATIONS ===\n");
        for (Medication med : meds) {
            prompt.append("- ").append(med.getName()).append(" ").append(med.getDosage());
            if (med.getNextDoseTime() != null) {
                prompt.append(" (next dose: ").append(med.getNextDoseTime().atZoneSameInstant(ZoneId.of("Asia/Ho_Chi_Minh")).format(TIME_FMT)).append(")");
            }
            prompt.append("\n");
        }
        prompt.append("\n");
    }

    private void appendAppointmentContext(StringBuilder prompt, User user) {
        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        OffsetDateTime threeMonthsLater = now.plusMonths(3);
        List<Appointment> appointments = appointmentRepository
            .findByElderlyIdAndDatetimeBetweenAndDeletedAtIsNullOrderByDatetimeAsc(
                user.getId(),
                now,
                threeMonthsLater
            );

        if (appointments.isEmpty()) return;

        prompt.append("=== UPCOMING APPOINTMENTS ===\n");
        int count = 0;
        for (Appointment appt : appointments) {
            if (count++ >= 3) break;
            if (appt.getStatus() == AppointmentStatus.CANCELLED) continue;
            prompt.append("- ").append(appt.getSpecialty()).append(" with ").append(appt.getDoctor())
                .append(" at ").append(appt.getLocation())
                .append(" on ").append(appt.getDatetime().atZoneSameInstant(ZoneId.of("Asia/Ho_Chi_Minh")).format(TIME_FMT)).append("\n");
        }
        prompt.append("\n");
    }

    private void appendFamilyContext(StringBuilder prompt, User user) {
        List<FamilyLink> links = familyLinkRepository.findAllFamilyByElderlyIdAndStatus(user.getId(), FamilyLinkStatus.ACTIVE);
        if (links.isEmpty()) return;

        prompt.append("=== CONNECTED FAMILY ===\n");
        for (FamilyLink link : links) {
            prompt.append("- ").append(link.getFamily().getName())
                .append(" (").append(link.getRelationship() != null ? link.getRelationship() : "family").append(")\n");
        }
        prompt.append("\n");
    }

    private String buildConversationContext(Long userId) {
        List<ChatMessage> recentMessages = chatMessageRepository.findTop20ByUserIdOrderByCreatedAtDesc(userId);
        if (recentMessages.isEmpty()) return "";

        Collections.reverse(recentMessages);

        StringBuilder context = new StringBuilder();
        context.append("=== RECENT CONVERSATION HISTORY ===\n");
        for (ChatMessage msg : recentMessages) {
            String role = msg.getRole() == ChatMessage.ChatRole.USER ? "Elderly" : "AI";
            String content = msg.getContent();
            if (content.length() > 300) {
                content = content.substring(0, 297) + "...";
            }
            context.append(role).append(": ").append(content).append("\n");
        }
        context.append("=== END OF HISTORY ===\n\n");
        context.append("Continue the conversation naturally based on the history above. Be warm and personal.\n");
        return context.toString();
    }

    private Map<String, Object> buildContextData(User user) {
        Map<String, Object> data = new HashMap<>();
        var profileOpt = elderlyProfileRepository.findByUserIdAndDeletedAtIsNull(user.getId());
        profileOpt.ifPresent(p -> data.put("healthConditions", p.getHealthConditions()));
        List<Medication> meds = medicationRepository.findByElderlyIdAndDeletedAtIsNull(user.getId());
        data.put("medicationCount", meds.size());
        return data;
    }

    private String classifyIntent(String aiResponse) {
        String lower = aiResponse.toLowerCase();
        if (lower.contains("blood pressure") || lower.contains("heart rate") || lower.contains("glucose")
            || lower.contains("health") || lower.contains("metric") || lower.contains("sức khỏe")
            || lower.contains("huyết áp") || lower.contains("đường huyết")) {
            return "HEALTH";
        }
        if (lower.contains("medication") || lower.contains("dose") || lower.contains("pill")
            || lower.contains("thuốc") || lower.contains("liều")) {
            return "MEDICATION";
        }
        if (lower.contains("appointment") || lower.contains("doctor") || lower.contains("hospital")
            || lower.contains("bác sĩ") || lower.contains("bệnh viện") || lower.contains("khám")) {
            return "APPOINTMENT";
        }
        if (lower.contains("remind") || lower.contains("nhắc") || lower.contains("don't forget")) {
            return "REMINDER";
        }
        return "GENERAL";
    }

    private String getTimeOfDayGreeting(int hour) {
        if (hour < 5) return "late night";
        if (hour < 12) return "morning";
        if (hour < 14) return "noon";
        if (hour < 18) return "afternoon";
        if (hour < 22) return "evening";
        return "night";
    }
}
