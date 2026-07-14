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

/**
 * Auth integration tests — updated for RN migration.
 *
 * Register: phone/email + password (no longer uses Firebase token).
 * Login: supports phone + password, email + password, OR legacy firebaseToken.
 */
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

    private static int phoneSuffix = 0;

    private static synchronized String nextPhone() {
        phoneSuffix++;
        return String.format("+849000%05d", phoneSuffix);
    }

    @BeforeEach
    void cleanDatabase() {
        jdbcTemplate.execute("DELETE FROM refresh_tokens");
        jdbcTemplate.execute("DELETE FROM users");
    }

    // ── Helpers ──────────────────────────────────────────────────────

    private MvcResult doRegister(String phone, String name, UserRole role) throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setPhone(phone);
        req.setName(name);
        req.setRole(role);
        req.setPassword("Test@1234");
        req.setConfirmPassword("Test@1234");
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

    // ── Register (phone + password) ──────────────────────────────────

    @Test
    void registerElderly_success() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setPhone(nextPhone());
        req.setName("Nguyen Van A");
        req.setRole(UserRole.ELDERLY);
        req.setPassword("Test@1234");
        req.setConfirmPassword("Test@1234");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty());
    }

    @Test
    void registerFamily_success() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setPhone(nextPhone());
        req.setName("Tran Thi B");
        req.setRole(UserRole.FAMILY);
        req.setPassword("Test@1234");
        req.setConfirmPassword("Test@1234");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty());
    }

    @Test
    void registerWithEmail_success() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("testuser@carenest.dev");
        req.setName("Email User");
        req.setRole(UserRole.ELDERLY);
        req.setPassword("Test@1234");
        req.setConfirmPassword("Test@1234");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isNotEmpty());
    }

    @Test
    void registerDuplicatePhone_returns409() throws Exception {
        String phone = nextPhone();

        MvcResult first = doRegister(phone, "Phan C", UserRole.ELDERLY);
        assertEquals(201, first.getResponse().getStatus(), "first register must return 201");

        RegisterRequest req = new RegisterRequest();
        req.setPhone(phone);
        req.setName("Phan C Clone");
        req.setRole(UserRole.ELDERLY);
        req.setPassword("Test@9999");
        req.setConfirmPassword("Test@9999");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict());
    }

    @Test
    void registerPasswordMismatch_returns400() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setPhone(nextPhone());
        req.setName("Mismatch User");
        req.setRole(UserRole.ELDERLY);
        req.setPassword("Test@1234");
        req.setConfirmPassword("Different@5678");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void registerWeakPassword_returns400() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setPhone(nextPhone());
        req.setName("Weak Pass");
        req.setRole(UserRole.ELDERLY);
        req.setPassword("12345678");   // no uppercase, no lowercase mix
        req.setConfirmPassword("12345678");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    // ── Login (phone + password) ─────────────────────────────────────

    @Test
    void loginWithPhone_success() throws Exception {
        String phone = nextPhone();
        doRegister(phone, "Le D", UserRole.ELDERLY);

        LoginRequest loginReq = new LoginRequest();
        loginReq.setPhone(phone);
        loginReq.setPassword("Test@1234");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty());
    }

    @Test
    void loginWithEmail_success() throws Exception {
        RegisterRequest regReq = new RegisterRequest();
        regReq.setEmail("login-test@carenest.dev");
        regReq.setName("Email Login");
        regReq.setRole(UserRole.FAMILY);
        regReq.setPassword("Test@1234");
        regReq.setConfirmPassword("Test@1234");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(regReq)))
                .andExpect(status().isCreated());

        LoginRequest loginReq = new LoginRequest();
        loginReq.setEmail("login-test@carenest.dev");
        loginReq.setPassword("Test@1234");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty());
    }

    @Test
    void loginWrongPassword_returns401() throws Exception {
        String phone = nextPhone();
        doRegister(phone, "Wrong Pass", UserRole.ELDERLY);

        LoginRequest loginReq = new LoginRequest();
        loginReq.setPhone(phone);
        loginReq.setPassword("WrongPassword@1");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isUnauthorized());
    }

    // ── Login (legacy firebaseToken) ─────────────────────────────────

    @Test
    void loginWithFirebaseToken_success() throws Exception {
        when(firebaseService.verifyAndGetPhone("token-login-fb")).thenReturn(nextPhone());

        doRegister(nextPhone(), "FB User", UserRole.ELDERLY);

        LoginRequest loginReq = new LoginRequest();
        loginReq.setFirebaseToken("token-login-fb");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty());
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

    // ── Token refresh ────────────────────────────────────────────────

    @Test
    void refresh_success_issuesNewTokens() throws Exception {
        String phone = nextPhone();
        String refreshToken = extractRefreshToken(doRegister(phone, "Hoang E", UserRole.ELDERLY));

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
        String phone = nextPhone();
        String originalRefreshToken = extractRefreshToken(doRegister(phone, "Vo F", UserRole.ELDERLY));

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

    // ── Authorization guards ─────────────────────────────────────────

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
