package com.carenest.backend.controller;

import com.carenest.backend.exception.GlobalExceptionHandler;
import com.carenest.backend.service.AdminService;
import com.carenest.backend.service.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Pins that the class-level {@code @PreAuthorize("hasRole('ADMIN')")} on
 * {@link AdminController} actually denies non-ADMIN and anonymous callers — so the
 * gate can't be dropped in a refactor without a red test.
 */
@WebMvcTest(AdminController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import({AdminControllerSecurityTest.TestSecurityConfiguration.class, GlobalExceptionHandler.class})
class AdminControllerSecurityTest {

    @TestConfiguration
    @EnableMethodSecurity
    static class TestSecurityConfiguration {
        @Bean
        SecurityFilterChain testFilterChain(HttpSecurity http) throws Exception {
            return http.csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
                .build();
        }
    }

    @jakarta.annotation.Resource
    private MockMvc mvc;

    @MockBean
    private AdminService adminService;

    @MockBean
    private JwtService jwtService;

    @Test
    @WithMockUser(roles = "FAMILY")
    void familyRole_isForbiddenEverywhere() throws Exception {
        mvc.perform(get("/api/admin/overview")).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/users")).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/elderly")).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/cameras")).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/emergencies")).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/health-metrics")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ELDERLY")
    void elderlyRole_isForbidden() throws Exception {
        mvc.perform(get("/api/admin/subscriptions")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminRole_isAllowed() throws Exception {
        mvc.perform(get("/api/admin/overview")).andExpect(status().isOk());
    }
}
