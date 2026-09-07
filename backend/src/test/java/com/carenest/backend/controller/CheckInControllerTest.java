package com.carenest.backend.controller;

import com.carenest.backend.security.JwtAuthenticationFilter;
import com.carenest.backend.service.CheckInService;
import com.carenest.backend.service.JwtService;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CheckInController.class)
@AutoConfigureMockMvc(addFilters = false)
class CheckInControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockBean private CheckInService checkInService;
    @MockBean private JwtService jwtService;
    @MockBean private JwtAuthenticationFilter jwtAuthenticationFilter;

    @ParameterizedTest
    @ValueSource(ints = {1, 2, 3})
    void create_acceptsSupportedMoodValues(int mood) throws Exception {
        mockMvc.perform(post("/api/elderly/10/check-ins")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"mood\":" + mood + "}"))
            .andExpect(status().isCreated());

        verify(checkInService).create(eq(10L), any());
    }

    @Test
    void create_rejectsMoodFourBeforeCallingService() throws Exception {
        mockMvc.perform(post("/api/elderly/10/check-ins")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"mood\":4}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("mood: mood must be between 1 and 3"));

        verify(checkInService, never()).create(eq(10L), any());
    }
}
