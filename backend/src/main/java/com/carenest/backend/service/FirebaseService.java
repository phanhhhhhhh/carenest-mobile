package com.carenest.backend.service;

import com.carenest.backend.exception.UnauthorizedException;
import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class FirebaseService {

    private static final String DEV_PREFIX = "DEV_PHONE:";

    private final Environment environment;

    public String verifyAndGetPhone(String idToken) {
        if (idToken.startsWith(DEV_PREFIX)) {
            if (!environment.matchesProfiles("local") && !environment.matchesProfiles("dev")) {
                throw new UnauthorizedException("DEV_PHONE bypass không được phép trong môi trường này");
            }
            String phone = idToken.substring(DEV_PREFIX.length());
            log.warn("Dev mode auth — skipping Firebase for phone: {}", phone);
            return phone;
        }
        if (FirebaseApp.getApps().isEmpty()) {
            throw new IllegalArgumentException(
                "Firebase not initialized. Set FIREBASE_CREDENTIALS_PATH or use 'DEV_PHONE:+84xxx' token in dev."
            );
        }
        try {
            FirebaseToken token = FirebaseAuth.getInstance().verifyIdToken(idToken);
            String phone = (String) token.getClaims().getOrDefault("phone_number", "");
            if (phone.isBlank()) {
                throw new IllegalArgumentException("Firebase token missing phone_number claim");
            }
            return phone;
        } catch (FirebaseAuthException e) {
            throw new IllegalArgumentException("Invalid Firebase token: " + e.getMessage());
        }
    }
}