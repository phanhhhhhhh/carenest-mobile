package com.carenest.backend.security;

import com.carenest.backend.service.RateLimitService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.OffsetDateTime;


@Component
@RequiredArgsConstructor
@Order(1)
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitService rateLimitService;

    private static final int CHAT_MESSAGE_LIMIT_PER_MINUTE = 20;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();

        String endpoint = null;
        Integer limit = null;

        if (path.endsWith("/auth/login") || path.endsWith("/auth/forgot-password")
                || path.endsWith("/auth/send-otp") || path.endsWith("/auth/verify-otp")) {
            endpoint = path.substring(path.lastIndexOf('/') + 1);
        } else if (path.endsWith("/api/chat/message")) {
            endpoint = "chat-message";
            limit = CHAT_MESSAGE_LIMIT_PER_MINUTE;
        }

        if (endpoint != null) {
            String ip = request.getRemoteAddr();
            try {
                if (limit != null) {
                    rateLimitService.checkRateLimit(ip, endpoint, limit);
                } else {
                    rateLimitService.checkRateLimit(ip, endpoint);
                }
            } catch (Exception e) {
                response.setStatus(429);
                response.setContentType("application/json");
                response.getWriter().write(
                    "{\"status\":429,\"error\":\"" + e.getMessage() + "\",\"timestamp\":\""
                        + OffsetDateTime.now() + "\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
