package com.carenest.backend.config;

import com.carenest.backend.service.VisitStreakCalculator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

@Configuration
public class VisitTimeConfig {

    @Bean
    public Clock visitClock() {
        return Clock.system(VisitStreakCalculator.ICT);
    }
}
