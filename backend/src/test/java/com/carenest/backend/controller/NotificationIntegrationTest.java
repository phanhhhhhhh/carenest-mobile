package com.carenest.backend.controller;

import com.carenest.backend.dto.notification.NotificationResponse;
import com.carenest.backend.entity.NotificationType;
import com.carenest.backend.security.JwtAuthenticationFilter;
import com.carenest.backend.service.JwtService;
import com.carenest.backend.service.NotificationService;
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
import java.util.Map;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(NotificationController.class)
@AutoConfigureMockMvc(addFilters = false)
class NotificationIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean NotificationService notificationService;
    @MockBean JwtService jwtService;
    @MockBean JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    void getUnreadCount_returnsZero() throws Exception {
        when(notificationService.getUnreadCount(1L)).thenReturn(0L);

        mockMvc.perform(get("/api/users/1/notifications/unread-count"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.unreadCount").value(0));
    }

    @Test
    void getUnreadCount_returnsCorrectCount() throws Exception {
        when(notificationService.getUnreadCount(1L)).thenReturn(3L);

        mockMvc.perform(get("/api/users/1/notifications/unread-count"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.unreadCount").value(3));
    }

    @Test
    void getNotifications_returnsList() throws Exception {
        NotificationResponse n1 = NotificationResponse.builder()
            .id(1L).userId(1L).type(NotificationType.FAMILY_LINK_REQUEST)
            .title("Yêu cầu liên kết").body("Người thân muốn liên kết")
            .data(Map.of("linkId", 1)).createdAt(OffsetDateTime.now())
            .build();

        when(notificationService.getByUserId(1L, 0, 50)).thenReturn(List.of(n1));

        mockMvc.perform(get("/api/users/1/notifications"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(1))
            .andExpect(jsonPath("$[0].title").value("Yêu cầu liên kết"));
    }

    @Test
    void markAsRead_returnsUpdated() throws Exception {
        NotificationResponse resp = NotificationResponse.builder()
            .id(1L).userId(1L).type(NotificationType.HEALTH_ALERT)
            .title("Alert").body("Test alert")
            .readAt(OffsetDateTime.now())
            .createdAt(OffsetDateTime.now())
            .build();

        when(notificationService.markAsRead(1L)).thenReturn(resp);

        mockMvc.perform(patch("/api/notifications/1/read"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.readAt").isNotEmpty());
    }

    @Test
    void markAllAsRead_returns204() throws Exception {
        mockMvc.perform(patch("/api/users/1/notifications/read-all"))
            .andExpect(status().isNoContent());
    }
}
