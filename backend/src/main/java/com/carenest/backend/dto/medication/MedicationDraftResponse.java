package com.carenest.backend.dto.medication;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * A best-effort medication schedule extracted from a spoken description (UC B1).
 * Never saved directly — the family must review and confirm every field first;
 * {@code uncertainFields} flags what the extraction was unsure about.
 */
@Getter
@Builder
public class MedicationDraftResponse {

    private String transcript;
    private String name;
    private String dosage;
    private String instructions;
    private List<String> times;
    private List<Integer> daysOfWeek;
    private List<String> uncertainFields;
    private boolean confident;
}
