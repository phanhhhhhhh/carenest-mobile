package com.carenest.backend.service;

import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class FirebaseService {

    private static final String DEV_PREFIX = "DEV_PHONE:";

    /**
     * Verifies a Firebase ID Token and returns the user's phone number.
     * In dev mode (no Firebase credentials), accepts "DEV_PHONE:+84xxx" as a valid token.
     */
    public String verifyAndGetPhone(String idToken) {
        if (idToken.startsWith(DEV_PREFIX)) {
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
