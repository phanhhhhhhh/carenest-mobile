package com.carenest.backend.dto.visit;

import com.carenest.backend.entity.VisitCycleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VisitSettingsRequest {

    private VisitCycleType cycleType;

    private LocalDate elderlyBirthday;
}
