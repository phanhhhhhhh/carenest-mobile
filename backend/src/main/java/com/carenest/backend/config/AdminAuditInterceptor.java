package com.carenest.backend.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Writes one audit line per admin-console request. The console reads personal health
 * data across the whole product, so "which operator read what, when" must be
 * answerable after an incident. Ship these to a sink the ADMIN role cannot edit.
 */
@Slf4j
@Component
public class AdminAuditInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Object actor = auth != null ? auth.getPrincipal() : "anonymous";
        String qs = request.getQueryString();
        log.info("ADMIN_AUDIT actor={} {} {}{}",
            actor,
            request.getMethod(),
            request.getRequestURI(),
            qs != null ? "?" + qs : "");
        return true;
    }
}
