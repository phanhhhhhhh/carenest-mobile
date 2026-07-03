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

    @NotNull(message = "elderlyId không được để trống")
    private Long elderlyId;

    @NotBlank(message = "title không được để trống")
    private String title;

    @NotNull(message = "remindAt không được để trống")
    private OffsetDateTime remindAt;

    @NotNull(message = "repeatRule không được để trống")
    private RepeatRule repeatRule;
}
