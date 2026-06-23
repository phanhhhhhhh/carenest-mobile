package com.carenest.backend.controller;

import com.carenest.backend.dto.auth.LoginRequest;
import com.carenest.backend.dto.auth.RefreshRequest;
import com.carenest.backend.dto.auth.RegisterRequest;
import com.carenest.backend.entity.UserRole;
import com.carenest.backend.service.FirebaseService;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("itest")
class AuthIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired JdbcTemplate jdbcTemplate;
    @MockBean FirebaseService firebaseService;

    private static final String TEST_JWT_SECRET =
            "carenest-test-secret-key-for-testing-only-min-32-chars";

    @BeforeEach
    void cleanDatabase() {
        jdbcTemplate.execute("DELETE FROM refresh_tokens");
        jdbcTemplate.execute("DELETE FROM users");
    }

    private MvcResult doRegister(String firebaseToken, String name, UserRole role) throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setFirebaseToken(firebaseToken);
        req.setName(name);
        req.setRole(role);
        return mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andReturn();
    }

    private String generateExpiredToken(long userId) {
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("role", "ELDERLY")
                .issuedAt(new Date(System.currentTimeMillis() - 2000))
                .expiration(new Date(System.currentTimeMillis() - 1000))
                .signWith(Keys.hmacShaKeyFor(TEST_JWT_SECRET.getBytes(StandardCharsets.UTF_8)))
                .compact();
    }

    private String extractRefreshToken(MvcResult result) throws Exception {
        String body = result.getResponse().getContentAsString();
        return objectMapper.readTree(body).get("refreshToken").asText();
    }

    @Test
    void registerElderly_success() throws Exception {
        when(firebaseService.verifyAndGetPhone("token-elderly")).thenReturn("+84900000001");

        RegisterRequest req = new RegisterRequest();
        req.setFirebaseToken("token-elderly");
        req.setName("Nguyen Van A");
        req.setRole(UserRole.ELDERLY);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty());
    }

    @Test
    void registerFamily_success() throws Exception {
        when(firebaseService.verifyAndGetPhone("token-family")).thenReturn("+84900000010");

        RegisterRequest req = new RegisterRequest();
        req.setFirebaseToken("token-family");
        req.setName("Tran Thi B");
        req.setRole(UserRole.FAMILY);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty());
    }

    @Test
    void registerDuplicate_returns409() throws Exception {
        when(firebaseService.verifyAndGetPhone("token-dup")).thenReturn("+84900000002");

        MvcResult first = doRegister("token-dup", "Phan C", UserRole.ELDERLY);
        assertEquals(201, first.getResponse().getStatus(), "first register must return 201");

        RegisterRequest req = new RegisterRequest();
        req.setFirebaseToken("token-dup");
        req.setName("Phan C Clone");
        req.setRole(UserRole.ELDERLY);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict());
    }

    @Test
    void login_success() throws Exception {
        when(firebaseService.verifyAndGetPhone("token-login")).thenReturn("+84900000003");

        doRegister("token-login", "Le D", UserRole.ELDERLY);

        LoginRequest loginReq = new LoginRequest();
        loginReq.setFirebaseToken("token-login");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty());
    }

    @Test
    void login_invalidFirebaseToken_returns400() throws Exception {
        when(firebaseService.verifyAndGetPhone("bad-token"))
                .thenThrow(new IllegalArgumentException("Invalid Firebase token"));

        LoginRequest loginReq = new LoginRequest();
        loginReq.setFirebaseToken("bad-token");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void refresh_success_issuesNewTokens() throws Exception {
        when(firebaseService.verifyAndGetPhone("token-refresh")).thenReturn("+84900000004");

        String refreshToken = extractRefreshToken(doRegister("token-refresh", "Hoang E", UserRole.ELDERLY));

        RefreshRequest refreshReq = new RefreshRequest();
        refreshReq.setRefreshToken(refreshToken);

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty());
    }

    @Test
    void refreshOldTokenAfterRotation_returns401() throws Exception {
        when(firebaseService.verifyAndGetPhone("token-rotation")).thenReturn("+84900000005");

        String originalRefreshToken = extractRefreshToken(doRegister("token-rotation", "Vo F", UserRole.ELDERLY));

        RefreshRequest firstRefreshReq = new RefreshRequest();
        firstRefreshReq.setRefreshToken(originalRefreshToken);
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(firstRefreshReq)))
                .andExpect(status().isOk());

        RefreshRequest secondRefreshReq = new RefreshRequest();
        secondRefreshReq.setRefreshToken(originalRefreshToken);
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(secondRefreshReq)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedEndpoint_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/elderly-profiles/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedEndpoint_withExpiredJwt_returns401() throws Exception {
        mockMvc.perform(get("/api/elderly-profiles/1")
                        .header("Authorization", "Bearer " + generateExpiredToken(999L)))
                .andExpect(status().isUnauthorized());
    }
}
