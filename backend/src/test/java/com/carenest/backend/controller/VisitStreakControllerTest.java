package com.carenest.backend.controller;

import com.carenest.backend.dto.visit.ConfirmVisitRequest;
import com.carenest.backend.dto.visit.VisitStreakResponse;
import com.carenest.backend.exception.PossibleDuplicateVisitException;
import com.carenest.backend.security.JwtAuthenticationFilter;
import com.carenest.backend.service.JwtService;
import com.carenest.backend.service.VisitStreakService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(VisitStreakController.class)
@AutoConfigureMockMvc(addFilters = false)
class VisitStreakControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockBean private VisitStreakService visitStreakService;
    @MockBean private JwtService jwtService;
    @MockBean private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    void possibleDuplicateReturnsStableConflictCode() throws Exception {
        when(visitStreakService.confirmVisit(eq(10L), isNull(), any()))
            .thenThrow(new PossibleDuplicateVisitException());

        mockMvc.perform(post("/api/elderly/10/visits")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value(PossibleDuplicateVisitException.CODE))
            .andExpect(jsonPath("$.message").value(PossibleDuplicateVisitException.MESSAGE));
    }

    @Test
    void explicitOverrideReturnsNormalCreatedResponse() throws Exception {
        when(visitStreakService.confirmVisit(eq(10L), isNull(), any()))
            .thenReturn(VisitStreakResponse.builder().elderlyId(10L).build());

        mockMvc.perform(post("/api/elderly/10/visits")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"note\":\"Second visit\",\"confirmSeparateVisit\":true}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.elderlyId").value(10));

        ArgumentCaptor<ConfirmVisitRequest> request =
            ArgumentCaptor.forClass(ConfirmVisitRequest.class);
        verify(visitStreakService).confirmVisit(eq(10L), isNull(), request.capture());
        assertThat(request.getValue().isConfirmSeparateVisit()).isTrue();
        assertThat(request.getValue().getNote()).isEqualTo("Second visit");
    }

    @Test
    void missingOverrideFieldRemainsCompatibleAndDefaultsFalse() throws Exception {
        when(visitStreakService.confirmVisit(eq(10L), isNull(), any()))
            .thenReturn(VisitStreakResponse.builder().elderlyId(10L).build());

        mockMvc.perform(post("/api/elderly/10/visits")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"note\":\"Normal visit\"}"))
            .andExpect(status().isCreated());

        ArgumentCaptor<ConfirmVisitRequest> request =
            ArgumentCaptor.forClass(ConfirmVisitRequest.class);
        verify(visitStreakService).confirmVisit(eq(10L), isNull(), request.capture());
        assertThat(request.getValue().isConfirmSeparateVisit()).isFalse();
    }
}
