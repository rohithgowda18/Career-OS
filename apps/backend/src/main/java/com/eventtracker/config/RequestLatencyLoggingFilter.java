package com.eventtracker.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestLatencyLoggingFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        long startTime = System.nanoTime();

        String uri = request.getRequestURI();
        String method = request.getMethod();

        try {
            filterChain.doFilter(request, response);
        } finally {

            long durationMs = (System.nanoTime() - startTime) / 1_000_000;

            int status = response.getStatus();

            // Expose timing to browser DevTools
            response.setHeader(
                    "Server-Timing",
                    "total;dur=" + durationMs);

            // Ignore noisy static/health requests
            if (uri.equals("/favicon.ico")
                    || uri.equals("/actuator/health")
                    || uri.startsWith("/error")) {
                return;
            }

            if (durationMs >= 3000) {

                log.error(
                        "[LATENCY: CRITICAL] {} {} -> status={}, duration={}ms",
                        method,
                        uri,
                        status,
                        durationMs);

            } else if (durationMs >= 1000) {

                log.warn(
                        "[LATENCY: HIGH] {} {} -> status={}, duration={}ms",
                        method,
                        uri,
                        status,
                        durationMs);

            } else if (durationMs >= 500) {

                log.warn(
                        "[LATENCY: SLOW] {} {} -> status={}, duration={}ms",
                        method,
                        uri,
                        status,
                        durationMs);
            }
        }
    }
}
