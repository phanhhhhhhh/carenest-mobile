package com.carenest.backend.service;

import com.carenest.backend.entity.OtpVerification;
import com.carenest.backend.exception.RateLimitExceededException;
import com.carenest.backend.repository.OtpVerificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpVerificationRepository otpRepository;
    private final EmailService emailService;

    private static final int OTP_LENGTH = 6;
    private static final int OTP_EXPIRY_MINUTES = 10;
    private static final int MAX_ATTEMPTS = 5;

    private static final int MAX_REQUESTS_PER_WINDOW = 5;
    private static final long WINDOW_MINUTES = 10;

    private record RateWindow(Instant windowStart, int count) {
    }

    private final ConcurrentHashMap<String, RateWindow> sendWindows = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, RateWindow> verifyWindows = new ConcurrentHashMap<>();

    private void checkAndRecord(ConcurrentHashMap<String, RateWindow> windows, String target, String action) {
        Instant now = Instant.now();
        RateWindow window = windows.compute(target, (k, existing) -> {
            if (existing == null || existing.windowStart().plus(WINDOW_MINUTES, ChronoUnit.MINUTES).isBefore(now)) {
                return new RateWindow(now, 1);
            }
            return new RateWindow(existing.windowStart(), existing.count() + 1);
        });

        if (window.count() > MAX_REQUESTS_PER_WINDOW) {
            long resetSeconds = window.windowStart().plus(WINDOW_MINUTES, ChronoUnit.MINUTES).getEpochSecond()
                    - now.getEpochSecond();
            long retryAfter = Math.max(resetSeconds, 1);
            log.warn("OTP {} rate limit exceeded for target (count={})", action, window.count());
            throw new RateLimitExceededException(
                    "Too many OTP " + action + " requests. Try again in " + retryAfter + " seconds.", retryAfter);
        }
    }


    public String generateAndPersist(String target) {
        checkAndRecord(sendWindows, target, "send");
        String code = generateOtp();
        OtpVerification otp = OtpVerification.builder()
            .phone(target)
            .otpCode(code)
            .expiresAt(OffsetDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES))
            .attempts((short) 0)
            .createdAt(OffsetDateTime.now())
            .build();
        otpRepository.save(otp);
        return code;
    }

    
    public void sendOtpViaEmail(String email, String userName) {
        String code = generateAndPersist(email);
        String subject = "Your CareNest verification code";
        String body = buildOtpEmail(userName, code);
        emailService.sendSimpleHtml(email, subject, body);
        log.info("OTP sent via email to {}", email);
    }

    
    public void sendOtpViaSms(String phone, String userName) {
        String code = generateAndPersist(phone);
        log.info("OTP via SMS to {}: code={} (DEV MODE — log only)", phone, code);
    }

    
    public boolean verifyOtp(String target, String code) {
        checkAndRecord(verifyWindows, target, "verify");
        OtpVerification otp = otpRepository
            .findTopByPhoneAndVerifiedAtIsNullOrderByCreatedAtDesc(target)
            .orElse(null);

        if (otp == null) {
            log.warn("No OTP found for {}", target);
            return false;
        }

        if (otp.getAttempts() >= MAX_ATTEMPTS) {
            log.warn("OTP max attempts exceeded for {}", target);
            return false;
        }

        otp.setAttempts((short) (otp.getAttempts() + 1));
        otpRepository.save(otp);

        if (otp.getExpiresAt().isBefore(OffsetDateTime.now())) {
            log.warn("OTP expired for {}", target);
            return false;
        }

        if (!otp.getOtpCode().equals(code)) {
            log.warn("OTP mismatch for {}", target);
            return false;
        }

        otp.setVerifiedAt(OffsetDateTime.now());
        otpRepository.save(otp);
        return true;
    }

    private String generateOtp() {
        SecureRandom random = new SecureRandom();
        int val = random.nextInt((int) Math.pow(10, OTP_LENGTH));
        return String.format("%0" + OTP_LENGTH + "d", val);
    }

    private String buildOtpEmail(String userName, String code) {
        return """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
                <div style="background: linear-gradient(135deg, #4CAF50, #2E7D32); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0;">CareNest 🌿</h1>
                </div>
                <div style="background: white; padding: 24px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
                    <h2 style="color: #333;">Hi %s,</h2>
                    <p style="color: #555; font-size: 15px;">Your verification code is:</p>
                    <div style="text-align: center; margin: 24px 0;">
                        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2E7D32; background: #E8F5E9; padding: 12px 28px; border-radius: 8px;">%s</span>
                    </div>
                    <p style="color: #999; font-size: 12px;">This code expires in %d minutes. Do not share it with anyone.</p>
                </div>
            </body>
            </html>
            """.formatted(userName, code, OTP_EXPIRY_MINUTES);
    }
}
