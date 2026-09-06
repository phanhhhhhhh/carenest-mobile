package com.carenest.backend.service;

import com.carenest.backend.dto.medication.MedicationDraftResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Voice-to-text medication schedule entry (UC B1). Transcribes a spoken
 * description then asks Gemini to extract structured fields. The result is a
 * DRAFT only: the family confirms or corrects every field before it is saved,
 * and low-confidence fields are surfaced explicitly.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MedicationVoiceService {

    private final SpeechToTextService speechToTextService;
    private final GeminiApiService geminiApiService;
    private final ObjectMapper objectMapper;

    private static final String EXTRACT_PROMPT = """
        Extract a medication schedule from the user's Vietnamese/English description.
        Return ONLY compact JSON, no prose, with exactly these keys:
        {"name": string|null, "dosage": string|null, "instructions": string|null,
         "times": ["HH:mm", ...], "daysOfWeek": [1..7 (1=Mon), ...],
         "uncertain": ["name"|"dosage"|"times"|"days", ...]}
        Rules: times as 24h "HH:mm"; empty daysOfWeek means every day; put a field
        name in "uncertain" if you are guessing. Never invent a medication name.
        """;

    public MedicationDraftResponse parseFromAudio(byte[] audio, String mimeType) {
        String transcript = speechToTextService.transcribe(audio, mimeType);
        if (transcript == null || transcript.isBlank()) {
            return MedicationDraftResponse.builder()
                .transcript(null)
                .times(List.of())
                .daysOfWeek(List.of())
                .uncertainFields(List.of("name", "dosage", "times", "days"))
                .confident(false)
                .build();
        }
        return parseFromText(transcript);
    }

    public MedicationDraftResponse parseFromText(String transcript) {
        List<String> uncertain = new ArrayList<>();
        String name = null;
        String dosage = null;
        String instructions = null;
        List<String> times = new ArrayList<>();
        List<Integer> days = new ArrayList<>();

        if (geminiApiService.isAvailable()) {
            try {
                String json = geminiApiService.generateContent(EXTRACT_PROMPT, transcript, 0.1, 512);
                JsonNode root = objectMapper.readTree(stripFences(json));
                name = text(root, "name");
                dosage = text(root, "dosage");
                instructions = text(root, "instructions");
                root.path("times").forEach(t -> times.add(t.asText()));
                root.path("daysOfWeek").forEach(d -> {
                    int v = d.asInt(0);
                    if (v >= 1 && v <= 7) days.add(v);
                });
                root.path("uncertain").forEach(u -> uncertain.add(u.asText()));
            } catch (Exception e) {
                log.warn("Gemini medication extraction failed: {}", e.getMessage());
                uncertain.addAll(List.of("name", "dosage", "times", "days"));
            }
        } else {
            uncertain.addAll(List.of("name", "dosage", "times", "days"));
        }

        if (name == null || name.isBlank()) {
            if (!uncertain.contains("name")) uncertain.add("name");
        }

        return MedicationDraftResponse.builder()
            .transcript(transcript)
            .name(name)
            .dosage(dosage)
            .instructions(instructions)
            .times(times)
            .daysOfWeek(days)
            .uncertainFields(uncertain)
            .confident(uncertain.isEmpty())
            .build();
    }

    private static String stripFences(String s) {
        String t = s.trim();
        if (t.startsWith("```")) {
            int nl = t.indexOf('\n');
            if (nl > 0) t = t.substring(nl + 1);
            if (t.endsWith("```")) t = t.substring(0, t.length() - 3);
        }
        return t.trim();
    }

    private static String text(JsonNode root, String field) {
        JsonNode n = root.path(field);
        return n.isNull() || n.isMissingNode() || n.asText().isBlank() ? null : n.asText();
    }
}
