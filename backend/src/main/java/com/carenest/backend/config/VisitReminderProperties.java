package com.carenest.backend.config;

import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

@Getter
@Setter
@Validated
@Lazy(false)
@Component
@ConfigurationProperties(prefix = "carenest.visit")
public class VisitReminderProperties {

    private boolean enabled = true;
    private String tetDate = "";

    @Min(1)
    private int weeklyLeadDays = 2;

    @Min(1)
    private int monthlyLeadDays = 4;

    @Min(1)
    private int birthdayLeadDays = 7;

    @Min(1)
    private int tetLeadDays = 10;
}
