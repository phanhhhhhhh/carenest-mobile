package com.carenest.backend.service;

import com.carenest.backend.entity.*;
import com.carenest.backend.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * UC-18: AI Proactive Reminder via Chat.
 * Sends friendly, Gemini-generated reminders through the chat channel
 * 30 minutes before medication doses or appointments.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatReminderService {

    private final GeminiApiService geminiApiService;
    private final ChatMessageRepository chatMessageRepository;
    private final FcmService fcmService;

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");
    private static final ZoneId ICT = ZoneId.of("Asia/Ho_Chi_Minh");

    /**
     * Send a medication reminder via chat.
     * Called by MedicationReminderScheduler when a medication is due.
     */
    @Transactional
    public void sendMedicationChatReminder(User elderly, Medication medication) {
        String reminderText = buildMedicationReminder(elderly, medication);

        // Save as AI chat message so it appears in the chat history
        ChatMessage chatMsg = ChatMessage.builder()
            .user(elderly)
            .role(ChatMessage.ChatRole.AI)
            .content(reminderText)
            .intent("REMINDER")
            .contextData(Map.of(
                "type", "MEDICATION_REMINDER",
                "medicationId", medication.getId().toString(),
                "medicationName", medication.getName(),
                "dosage", medication.getDosage()
            ))
            .sessionId("default-" + elderly.getId())
            .build();
        chatMessageRepository.save(chatMsg);

        // Also push via FCM
        fcmService.sendToUser(elderly.getId(),
            "💊 Medication Reminder",
            medication.getName() + " - " + medication.getDosage(),
            Map.of("type", "MEDICATION_REMINDER", "medicationId", medication.getId().toString()));

        log.info("Chat medication reminder sent: elderlyId={} medication={}", elderly.getId(), medication.getName());
    }

    /**
     * Send an appointment reminder via chat.
     * Called by ReminderScheduler when an appointment is upcoming.
     */
    @Transactional
    public void sendAppointmentChatReminder(User elderly, Appointment appointment) {
        String reminderText = buildAppointmentReminder(elderly, appointment);

        ChatMessage chatMsg = ChatMessage.builder()
            .user(elderly)
            .role(ChatMessage.ChatRole.AI)
            .content(reminderText)
            .intent("REMINDER")
            .contextData(Map.of(
                "type", "APPOINTMENT_REMINDER",
                "appointmentId", appointment.getId().toString(),
                "doctor", appointment.getDoctor() != null ? appointment.getDoctor() : ""
            ))
            .sessionId("default-" + elderly.getId())
            .build();
        chatMessageRepository.save(chatMsg);

        fcmService.sendToUser(elderly.getId(),
            "🏥 Appointment Reminder",
            appointment.getSpecialty() + " with " + appointment.getDoctor(),
            Map.of("type", "APPOINTMENT_REMINDER", "appointmentId", appointment.getId().toString()));

        log.info("Chat appointment reminder sent: elderlyId={} appointmentId={}", elderly.getId(), appointment.getId());
    }

    // ── AI-Powered Reminder Text ──────────────────────────────────────────────

    private String buildMedicationReminder(User elderly, Medication medication) {
        if (geminiApiService.isAvailable()) {
            try {
                String systemPrompt = """
                    You are a warm, caring AI companion for an elderly person.
                    Write a friendly medication reminder message in a conversational tone.
                    Include: greeting by name, medication name and dosage, time, a gentle encouragement.
                    Keep it short (2-3 sentences). Use the elderly's native language style (Vietnamese or English).
                    Make it feel like a family member reminding them, not a robot.
                    """;

                String dataContext = "Elderly name: " + elderly.getName() + "\n"
                    + "Medication: " + medication.getName() + " " + medication.getDosage() + "\n"
                    + "Due time: " + ZonedDateTime.now(ICT).format(TIME_FMT) + "\n"
                    + (medication.getInstructions() != null ? "Instructions: " + medication.getInstructions() + "\n" : "")
                    + "\nGenerate a warm, caring reminder message.";

                return geminiApiService.generateConversational(systemPrompt, dataContext);
            } catch (Exception e) {
                log.warn("Gemini chat reminder failed, using template: {}", e.getMessage());
            }
        }
        // Fallback template
        String time = ZonedDateTime.now(ICT).format(TIME_FMT);
        return "🌿 " + elderly.getName() + " ơi, đã đến giờ uống thuốc rồi ạ!\n\n"
            + "💊 " + medication.getName() + " — " + medication.getDosage() + "\n"
            + (medication.getInstructions() != null ? "📝 " + medication.getInstructions() + "\n\n" : "\n")
            + "⏰ " + time + "\n\n"
            + "Bà nhớ uống đúng giờ để giữ sức khỏe tốt nhé! ❤️";
    }

    private String buildAppointmentReminder(User elderly, Appointment appointment) {
        if (geminiApiService.isAvailable()) {
            try {
                String systemPrompt = """
                    You are a warm, caring AI companion for an elderly person.
                    Write a friendly appointment reminder in a conversational tone.
                    Include: greeting by name, doctor/specialty, location, time, a gentle encouragement.
                    Keep it short (2-3 sentences).
                    Make it feel helpful and caring, not alarming.
                    """;

                String dataContext = "Elderly name: " + elderly.getName() + "\n"
                    + "Doctor: " + (appointment.getDoctor() != null ? appointment.getDoctor() : "TBD") + "\n"
                    + "Specialty: " + (appointment.getSpecialty() != null ? appointment.getSpecialty() : "General") + "\n"
                    + "Location: " + (appointment.getLocation() != null ? appointment.getLocation() : "TBD") + "\n"
                    + "Date/Time: " + appointment.getDatetime()
                        .atZoneSameInstant(ICT).format(DateTimeFormatter.ofPattern("EEEE, MMM d 'at' HH:mm")) + "\n"
                    + "\nGenerate a warm, caring appointment reminder.";

                return geminiApiService.generateConversational(systemPrompt, dataContext);
            } catch (Exception e) {
                log.warn("Gemini appointment reminder failed, using template: {}", e.getMessage());
            }
        }
        // Fallback template
        return "🏥 " + elderly.getName() + " ơi, hôm nay bà có lịch khám bệnh ạ!\n\n"
            + "👨‍⚕️ " + (appointment.getDoctor() != null ? "Bác sĩ " + appointment.getDoctor() : "Khám bệnh") + "\n"
            + "🏥 " + (appointment.getSpecialty() != null ? appointment.getSpecialty() : "") + "\n"
            + "📍 " + (appointment.getLocation() != null ? appointment.getLocation() : "") + "\n"
            + "⏰ " + appointment.getDatetime().atZoneSameInstant(ICT)
                .format(DateTimeFormatter.ofPattern("HH:mm 'ngày' dd/MM")) + "\n\n"
            + "Bà nhớ đi đúng giờ và mang theo thẻ BHYT nhé! ❤️";
    }
}
