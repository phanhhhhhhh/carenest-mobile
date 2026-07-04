package com.carenest.backend.dto.reminder;

import com.carenest.backend.entity.RepeatRule;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReminderRequest {

    @NotNull(message = "elderlyId is required")
    private Long elderlyId;

    @NotBlank(message = "title is required")
    private String title;

    @NotNull(message = "remindAt is required")
    private OffsetDateTime remindAt;

    @NotNull(message = "repeatRule is required")
    private RepeatRule repeatRule;
}
