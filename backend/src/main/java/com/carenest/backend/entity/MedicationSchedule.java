package com.carenest.backend.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicationSchedule {

    /** e.g. "DAILY", "TWICE_DAILY", "WEEKLY" */
    private String frequency;

    /** e.g. ["08:00", "20:00"] */
    private List<String> times;

    /** 1–7, null for daily schedules */
    private List<Integer> daysOfWeek;
}
