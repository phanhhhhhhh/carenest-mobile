package com.carenest.backend.controller;

import com.carenest.backend.entity.CameraDevice;
import com.carenest.backend.entity.User;
import com.carenest.backend.exception.CameraLinkException;
import com.carenest.backend.exception.GlobalExceptionHandler;
import com.carenest.backend.security.AuthorizationService;
import com.carenest.backend.service.CameraConsentService;
import com.carenest.backend.service.CameraService;
import com.carenest.backend.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CameraController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import({CameraControllerTest.TestSecurityConfiguration.class, GlobalExceptionHandler.class})
class CameraControllerTest {

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
    @MockBean private CameraService cameraService;
    @MockBean private CameraConsentService cameraConsentService;
    @MockBean private JwtService jwtService;
    @MockBean(name = "authz") private AuthorizationService authorizationService;

    @BeforeEach
    void setUp() {
        when(authorizationService.isOwnerOrLinkedFamily(7L, 10L)).thenReturn(true);
        when(cameraService.bindCamera(10L, "ABC123", "Living room", "SC1234"))
            .thenReturn(CameraDevice.builder()
                .id(99L)
                .elderly(User.builder().id(10L).build())
                .deviceSn("ABC123")
                .deviceId("ABC123")
                .label("Living room")
                .status(CameraDevice.CameraStatus.OFFLINE)
                .capabilities("WLAN,AudioTalk")
                .build());
    }

    @Test
    void activeLinkedFamilyCanLinkWithValidatedRequest() throws Exception {
        mockMvc.perform(post("/api/elderly/10/cameras")
                .with(authentication(family()))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"deviceSn":"ABC123","label":"Living room","verificationCode":"SC1234"}
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value("OFFLINE"))
            .andExpect(jsonPath("$.capabilities[1]").value("AudioTalk"));
    }

    @Test
    void unlinkedFamilyIsForbidden() throws Exception {
        when(authorizationService.isOwnerOrLinkedFamily(7L, 10L)).thenReturn(false);

        mockMvc.perform(post("/api/elderly/10/cameras")
                .with(authentication(family()))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{" + "\"deviceSn\":\"ABC123\",\"label\":\"Room\"}"))
            .andExpect(status().isForbidden());

        verify(cameraService, never()).bindCamera(eq(10L), anyString(), anyString(), anyString());
    }

    @Test
    void elderlyRoleCannotPerformD2() throws Exception {
        mockMvc.perform(post("/api/elderly/10/cameras")
                .with(authentication(elderly()))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{" + "\"deviceSn\":\"ABC123\",\"label\":\"Room\"}"))
            .andExpect(status().isForbidden());
    }

    @Test
    void invalidSerialAndBlankLabelAreRejectedBeforeService() throws Exception {
        mockMvc.perform(post("/api/elderly/10/cameras")
                .with(authentication(family()))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{" + "\"deviceSn\":\"bad serial!\",\"label\":\"   \"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value(
                org.hamcrest.Matchers.containsString("deviceSn")))
            .andExpect(jsonPath("$.error").value(
                org.hamcrest.Matchers.containsString("label")));

        verify(cameraService, never()).bindCamera(eq(10L), anyString(), anyString(), anyString());
    }

    @Test
    void stableProviderErrorCodeIsReturned() throws Exception {
        when(cameraService.bindCamera(10L, "ABC123", "Living room", "SC1234"))
            .thenThrow(new CameraLinkException(
                "IMOU_BOUND_TO_ANOTHER_ACCOUNT",
                HttpStatus.CONFLICT,
                "This camera is bound to another IMOU account"));

        mockMvc.perform(post("/api/elderly/10/cameras")
                .with(authentication(family()))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"deviceSn":"ABC123","label":"Living room","verificationCode":"SC1234"}
                    """))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("IMOU_BOUND_TO_ANOTHER_ACCOUNT"));
    }

    private Authentication family() {
        Authentication authentication = new UsernamePasswordAuthenticationToken(7L, null,
            List.of(new SimpleGrantedAuthority("ROLE_FAMILY")));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        return authentication;
    }

    private Authentication elderly() {
        Authentication authentication = new UsernamePasswordAuthenticationToken(10L, null,
            List.of(new SimpleGrantedAuthority("ROLE_ELDERLY")));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        return authentication;
    }
}
