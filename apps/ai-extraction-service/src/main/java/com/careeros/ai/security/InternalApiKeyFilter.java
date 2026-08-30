package com.careeros.ai.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
public class InternalApiKeyFilter extends OncePerRequestFilter {

    public static final String HEADER_NAME = "X-Internal-Service-Key";

    @Value("${app.internal-key:career-os-internal-ai-secret}")
    private String expectedInternalKey;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String path = request.getRequestURI();

        // Allow actuator health checks and non-extraction endpoints without key
        if (!path.startsWith("/api/extraction")) {
            filterChain.doFilter(request, response);
            return;
        }

        String providedKey = request.getHeader(HEADER_NAME);

        if (expectedInternalKey != null && !expectedInternalKey.isBlank()) {
            if (providedKey == null || !expectedInternalKey.equals(providedKey.trim())) {
                log.warn("Unauthorized attempt to access AI Extraction API at {} without valid service key", path);
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\": \"Unauthorized: Missing or invalid X-Internal-Service-Key header\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
