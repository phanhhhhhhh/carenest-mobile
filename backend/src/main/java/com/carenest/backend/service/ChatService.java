package com.carenest.backend.service;

import com.carenest.backend.dto.chat.ChatHistoryResponse;
import com.carenest.backend.dto.chat.ChatRequest;
import com.carenest.backend.dto.chat.ChatResponse;
import com.carenest.backend.entity.*;
import com.carenest.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm 'on' EEEE, MMM d");

    /**
     * Send a message to the AI and get a response.
     */
    @Transactional
    public ChatResponse sendMessage(Long userId, ChatRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new com.carenest.backend.exception.NotFoundException("User not found"));

        String sessionId = request.getSessionId() != null
            ? request.getSessionId()
            : "default-" + userId;

        // 1. Save user message
        ChatMessage userMsg = ChatMessage.builder()
            .user(user)
            .role(ChatMessage.ChatRole.USER)
            .content(request.getMessage())
            .sessionId(sessionId)
            .build();
        chatMessageRepository.save(userMsg);

        // 2. Build system prompt with elderly health context
        String systemPrompt = buildSystemPrompt(user);
        String conversationHistory = buildConversationContext(userId);

        // 3. Call Gemini API
        String fullPrompt = conversationHistory + "\nElderly: " + request.getMessage();
        String aiResponse = geminiApiService.generateConversational(systemPrompt, fullPrompt);

        // 4. Classify intent
        String intent = classifyIntent(aiResponse);

        // 5. Build context data for audit
        Map<String, Object> contextData = buildContextData(user);

        // 6. Save AI response
        ChatMessage aiMsg = ChatMessage.builder()
            .user(user)
            .role(ChatMessage.ChatRole.AI)
            .content(aiResponse)
            .intent(intent)
            .contextData(contextData)
            .sessionId(sessionId)
            .build();
        chatMessageRepository.save(aiMsg);

        // 7. Return response
        return ChatResponse.builder()
            .messageId(aiMsg.getId())
            .role("AI")
            .content(aiResponse)
            .intent(intent)
            .sessionId(sessionId)
            .createdAt(aiMsg.getCreatedAt())
            .build();
    }

    /**
     * Get paginated chat history for a user.
     */
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
        // Reverse to show oldest first for chat UI
        Collections.reverse(responses);

        return ChatHistoryResponse.builder()
            .messages(responses)
            .page(page)
            .size(size)
            .totalMessages(messages.getTotalElements())
            .hasMore(messages.hasNext())
            .build();
    }

    /**
     * Clear chat history for a user.
     */
    @Transactional
    public void clearHistory(Long userId) {
        chatMessageRepository.deleteByUserId(userId);
        log.info("Chat history cleared for user {}", userId);
    }

    // ── Private: Prompt Building ─────────────────────────────────────────────

    private String buildSystemPrompt(User user) {
        StringBuilder prompt = new StringBuilder();

        // Personality and role
        prompt.append("You are a warm, caring AI companion for an elderly person named ");
        prompt.append(user.getName()).append(".\n\n");

        // Time awareness
        ZonedDateTime now = ZonedDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        prompt.append("Current time: ").append(now.format(DateTimeFormatter.ofPattern("HH:mm 'on' EEEE, MMM d, yyyy"))).append(".\n");

        String timeOfDay = getTimeOfDayGreeting(now.getHour());
        prompt.append("It is ").append(timeOfDay).append(". Greet them appropriately.\n\n");

        // Core rules
        prompt.append("=== YOUR PERSONALITY & RULES ===\n");
        prompt.append("1. Use simple, warm Vietnamese or English (match the elderly's language) with large-font friendly tone.\n");
        prompt.append("2. You are NOT a doctor. Never diagnose or prescribe. Always add: 'Please consult your doctor for medical advice.'\n");
        prompt.append("3. If they ask about their health, use the provided health data to give friendly observations.\n");
        prompt.append("4. If they ask about medications, check the medication list and remind them.\n");
        prompt.append("5. If they seem lonely or sad, provide companionship — tell stories, ask about their day, share wisdom.\n");
        prompt.append("6. Keep responses concise (2-4 sentences) unless they ask for details.\n");
        prompt.append("7. Call them by their name to be personal.\n\n");

        // Health context
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

        // Latest health metrics
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

        // Reverse to chronological order
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
