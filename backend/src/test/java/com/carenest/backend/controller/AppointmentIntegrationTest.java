package com.carenest.backend.controller;

import com.carenest.backend.dto.appointment.AppointmentRequest;
import com.carenest.backend.dto.appointment.AppointmentResponse;
import com.carenest.backend.entity.AppointmentStatus;
import com.carenest.backend.security.JwtAuthenticationFilter;
import com.carenest.backend.service.AppointmentService;
import com.carenest.backend.service.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AppointmentController.class)
@AutoConfigureMockMvc(addFilters = false)
class AppointmentIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean AppointmentService appointmentService;
    @MockBean JwtService jwtService;
    @MockBean JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    void createAppointment_returns201() throws Exception {
        AppointmentRequest req = AppointmentRequest.builder()
            .elderlyId(1L)
            .doctor("Dr. Smith")
            .specialty("Cardiology")
            .location("City Hospital")
            .datetime(OffsetDateTime.now().plusDays(7))
            .notes("Annual checkup")
            .build();

        AppointmentResponse resp = AppointmentResponse.builder()
            .id(100L)
            .elderlyId(1L)
            .elderlyName("Elderly A")
            .doctor("Dr. Smith")
            .specialty("Cardiology")
            .location("City Hospital")
            .datetime(req.getDatetime())
            .notes("Annual checkup")
            .status(AppointmentStatus.SCHEDULED)
            .build();

        when(appointmentService.create(any())).thenReturn(resp);

        mockMvc.perform(post("/api/appointments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(100))
            .andExpect(jsonPath("$.doctor").value("Dr. Smith"))
            .andExpect(jsonPath("$.status").value("SCHEDULED"));
    }

    @Test
    void getAppointmentsByUserId_returns200() throws Exception {
        AppointmentResponse resp = AppointmentResponse.builder()
            .id(1L).elderlyId(1L).elderlyName("Elderly B")
            .doctor("Dr. Jones").location("Central Clinic")
            .datetime(OffsetDateTime.now().plusDays(14))
            .status(AppointmentStatus.SCHEDULED)
            .build();

        when(appointmentService.getByUserId(1L)).thenReturn(List.of(resp));

        mockMvc.perform(get("/api/users/1/appointments"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].doctor").value("Dr. Jones"));
    }

    @Test
    void getAppointmentById_returns200() throws Exception {
        AppointmentResponse resp = AppointmentResponse.builder()
            .id(5L).elderlyId(1L).elderlyName("Elderly C")
            .doctor("Dr. Brown").location("West Medical")
            .datetime(OffsetDateTime.now().plusDays(21))
            .status(AppointmentStatus.SCHEDULED)
            .build();

        when(appointmentService.getById(5L)).thenReturn(resp);

        mockMvc.perform(get("/api/appointments/5"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.doctor").value("Dr. Brown"));
    }

    @Test
    void updateAppointment_returns200() throws Exception {
        AppointmentRequest req = AppointmentRequest.builder()
            .elderlyId(1L)
            .doctor("Dr. Updated")
            .location("Updated Clinic")
            .datetime(OffsetDateTime.now().plusDays(10))
            .build();

        AppointmentResponse resp = AppointmentResponse.builder()
            .id(5L).elderlyId(1L).elderlyName("Elderly D")
            .doctor("Dr. Updated").location("Updated Clinic")
            .datetime(req.getDatetime())
            .status(AppointmentStatus.SCHEDULED)
            .build();

        when(appointmentService.update(eq(5L), any())).thenReturn(resp);

        mockMvc.perform(patch("/api/appointments/5")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.doctor").value("Dr. Updated"))
            .andExpect(jsonPath("$.location").value("Updated Clinic"));
    }

    @Test
    void deleteAppointment_returns204() throws Exception {
        mockMvc.perform(delete("/api/appointments/5"))
            .andExpect(status().isNoContent());
    }
}
