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

/**
 * Applies rate limiting to auth endpoints: login, forgot-password.
 * Runs BEFORE the JWT filter so unauthenticated requests are also rate-limited.
 */
@Component
@RequiredArgsConstructor
@Order(1)
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitService rateLimitService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();

        // Only rate-limit specific auth endpoints
        if (path.endsWith("/auth/login") || path.endsWith("/auth/forgot-password")) {
            String ip = getClientIp(request);
            String endpoint = path.substring(path.lastIndexOf('/') + 1);
            try {
                rateLimitService.checkRateLimit(ip, endpoint);
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

    private String getClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
