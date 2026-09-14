package com.carenest.backend.config;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class VisitReminderPropertiesTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void defaultsMatchProductReminderWindows() {
        VisitReminderProperties properties = new VisitReminderProperties();
        assertEquals(2, properties.getWeeklyLeadDays());
        assertEquals(4, properties.getMonthlyLeadDays());
        assertEquals(7, properties.getBirthdayLeadDays());
        assertEquals(10, properties.getTetLeadDays());
        assertTrue(validator.validate(properties).isEmpty());
    }

    @Test
    void leadDaysMustBePositive() {
        VisitReminderProperties properties = new VisitReminderProperties();
        properties.setWeeklyLeadDays(0);
        properties.setMonthlyLeadDays(0);
        properties.setBirthdayLeadDays(0);
        properties.setTetLeadDays(0);
        assertEquals(4, validator.validate(properties).size());
    }
}
