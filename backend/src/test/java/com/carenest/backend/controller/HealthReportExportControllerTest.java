package com.carenest.backend.controller;

import com.carenest.backend.dto.health.HealthReportResponse;
import com.carenest.backend.entity.HealthMetricType;
import com.carenest.backend.exception.GlobalExceptionHandler;
import com.carenest.backend.exception.PaymentRequiredException;
import com.carenest.backend.security.AuthorizationService;
import com.carenest.backend.service.HealthReportPdfService;
import com.carenest.backend.service.HealthReportService;
import com.carenest.backend.service.JwtService;
import com.carenest.backend.service.SubscriptionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(HealthReportExportController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import({HealthReportExportControllerTest.TestSecurityConfiguration.class, GlobalExceptionHandler.class})
class HealthReportExportControllerTest {

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

    @jakarta.annotation.Resource private MockMvc mockMvc;
    @MockBean private SubscriptionService subscriptionService;
    @MockBean private HealthReportService healthReportService;
    @MockBean private HealthReportPdfService healthReportPdfService;
    @MockBean private JwtService jwtService;
    @MockBean(name = "authz") private AuthorizationService authorizationService;

    private final OffsetDateTime from = OffsetDateTime.of(2026, 8, 1, 0, 0, 0, 0, ZoneOffset.ofHours(7));
    private final OffsetDateTime to = OffsetDateTime.of(2026, 8, 31, 23, 59, 0, 0, ZoneOffset.ofHours(7));
    private final HealthReportResponse emptyReport = HealthReportResponse.builder()
        .elderlyId(11L).elderlyName("Bà Sáu").from(from).to(to).reports(List.of()).build();

    @BeforeEach
    void setUp() {
        when(authorizationService.isOwnerOrLinkedFamily(7L, 11L)).thenReturn(true);
        when(healthReportService.resolvePeriod(any(), any()))
            .thenReturn(new HealthReportService.ReportPeriod(from, to));
        when(healthReportService.generateReport(eq(11L), any(), eq(from), eq(to))).thenReturn(emptyReport);
        when(healthReportPdfService.generate(emptyReport)).thenReturn(
            new HealthReportPdfService.PdfResult("%PDF-valid".getBytes(),
                "carenest-health-report-ba-sau-20260831.pdf"));
    }

    @Test
    void linkedPremiumFamilyReceivesPdfWithSafeHeaders() throws Exception {
        mockMvc.perform(get("/api/elderly/11/health-report.pdf")
                .with(authentication(family())))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_PDF))
            .andExpect(content().bytes("%PDF-valid".getBytes()))
            .andExpect(header().string("Content-Disposition",
                org.hamcrest.Matchers.containsString("carenest-health-report-ba-sau-20260831.pdf")))
            .andExpect(header().string("Cache-Control", org.hamcrest.Matchers.containsString("no-store")))
            .andExpect(header().string("Cache-Control", org.hamcrest.Matchers.containsString("private")))
            .andExpect(header().string("X-Content-Type-Options", "nosniff"));

        verify(subscriptionService).requirePremium(7L);
    }

    @Test
    void linkedFreeFamilyReceivesPaymentRequired() throws Exception {
        doThrow(new PaymentRequiredException(SubscriptionService.PREMIUM_REQUIRED_MESSAGE))
            .when(subscriptionService).requirePremium(7L);

        mockMvc.perform(get("/api/elderly/11/health-report.pdf").with(authentication(family())))
            .andExpect(status().isPaymentRequired())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON));
    }

    @Test
    void unlinkedPremiumFamilyReceivesForbidden() throws Exception {
        when(authorizationService.isOwnerOrLinkedFamily(7L, 11L)).thenReturn(false);
        mockMvc.perform(get("/api/elderly/11/health-report.pdf").with(authentication(family())))
            .andExpect(status().isForbidden());
    }

    @Test
    void elderlyRoleReceivesForbidden() throws Exception {
        mockMvc.perform(get("/api/elderly/11/health-report.pdf").with(authentication(elderly())))
            .andExpect(status().isForbidden());
    }

    @Test
    void invalidDateRangeReceivesBadRequest() throws Exception {
        when(healthReportService.resolvePeriod(any(), any()))
            .thenThrow(new IllegalArgumentException("from must be before or equal to to"));
        mockMvc.perform(get("/api/elderly/11/health-report.pdf")
                .param("from", "2026-09-02T00:00:00+07:00")
                .param("to", "2026-09-01T00:00:00+07:00")
                .with(authentication(family())))
            .andExpect(status().isBadRequest());
    }

    @Test
    void rangeBeyondLimitReceivesBadRequest() throws Exception {
        OffsetDateTime old = from.minusDays(366);
        when(healthReportService.resolvePeriod(any(), any()))
            .thenReturn(new HealthReportService.ReportPeriod(old, from));
        mockMvc.perform(get("/api/elderly/11/health-report.pdf").with(authentication(family())))
            .andExpect(status().isBadRequest());
    }

    @Test
    void metricFiltersArePassedToSharedReportService() throws Exception {
        mockMvc.perform(get("/api/elderly/11/health-report.pdf")
                .param("types", "HEART_RATE,BLOOD_PRESSURE")
                .with(authentication(family())))
            .andExpect(status().isOk());

        verify(healthReportService).generateReport(11L,
            Set.of(HealthMetricType.HEART_RATE, HealthMetricType.BLOOD_PRESSURE), from, to);
    }

    private Authentication family() {
        Authentication authentication = new UsernamePasswordAuthenticationToken(7L, null,
            List.of(new SimpleGrantedAuthority("ROLE_FAMILY")));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        return authentication;
    }

    private Authentication elderly() {
        Authentication authentication = new UsernamePasswordAuthenticationToken(11L, null,
            List.of(new SimpleGrantedAuthority("ROLE_ELDERLY")));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        return authentication;
    }
}
