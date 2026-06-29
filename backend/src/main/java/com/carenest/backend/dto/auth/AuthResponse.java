package com.carenest.backend.dto.auth;

import com.carenest.backend.entity.User;
import lombok.Getter;

@Getter
public class AuthResponse {

    private final String accessToken;
    private final String refreshToken;
    private final String tokenType = "Bearer";
    private final long expiresIn;
    private final UserResponse user;

    public AuthResponse(String accessToken, String refreshToken, long expiresInSeconds, User user) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expiresIn = expiresInSeconds;
        this.user = new UserResponse(user);
    }
}