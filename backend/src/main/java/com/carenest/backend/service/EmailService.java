package com.carenest.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Email service for verification, password reset, and notifications.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Value("${carenest.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    /**
     * Send email verification link.
     */
    @Async
    public void sendVerificationEmail(String to, String userName, String token) {
        String verifyUrl = frontendUrl + "/verify-email?token=" + token;
        String subject = "Verify your CareNest account";
        String body = buildHtmlEmail(
            "Welcome to CareNest, " + userName + "! 🌿",
            "Please verify your email address to activate your account.",
            "Verify Email",
            verifyUrl,
            "This link will expire in 24 hours. If you did not create this account, please ignore this email."
        );
        send(to, subject, body);
    }

    /**
     * Send password reset email.
     */
    @Async
    public void sendPasswordResetEmail(String to, String userName, String token) {
        String resetUrl = frontendUrl + "/reset-password?token=" + token;
        String subject = "Reset your CareNest password";
        String body = buildHtmlEmail(
            "Password Reset Request",
            "Hi " + userName + ", we received a request to reset your password.",
            "Reset Password",
            resetUrl,
            "This link will expire in 15 minutes. If you did not request this, please ignore this email."
        );
        send(to, subject, body);
    }

    /**
     * Send welcome email after successful verification.
     */
    @Async
    public void sendWelcomeEmail(String to, String userName) {
        String subject = "Welcome to CareNest! 🎉";
        String body = buildHtmlEmail(
            "Your account is now verified, " + userName + "!",
            "Thank you for joining CareNest. You can now log in and start using the app to monitor your loved ones' health.",
            "Go to CareNest",
            frontendUrl + "/login",
            "If you have any questions, please contact our support team."
        );
        send(to, subject, body);
    }

    // ── Private ──────────────────────────────────────────────────────────────

    private void send(String to, String subject, String htmlBody) {
        if (fromEmail == null || fromEmail.isBlank()) {
            log.warn("spring.mail.username not configured — skipping email to {}", to);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email sent: type={} to={}", subject, to);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    private String buildHtmlEmail(String title, String message, String buttonText, String buttonUrl, String footer) {
        return """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #4CAF50, #2E7D32); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">CareNest 🌿</h1>
                </div>
                <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
                    <h2 style="color: #333;">%s</h2>
                    <p style="color: #555; font-size: 16px; line-height: 1.6;">%s</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="%s" style="background: #4CAF50; color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">%s</a>
                    </div>
                    <p style="color: #999; font-size: 12px; margin-top: 20px;">%s</p>
                </div>
            </body>
            </html>
            """.formatted(title, message, buttonUrl, buttonText, footer);
    }
}
