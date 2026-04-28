package com.eventtracker.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.eventtracker.service.UserService;

import java.io.IOException;

/**
 * JWT filter using ObjectProvider<UserService> for lazy resolution.
 * This breaks the eager SecurityConfig -> UserService bean graph that would
 * otherwise force BCrypt + 3 repositories to initialize at startup before
 * lazy-initialization can take effect. Saves ~3-4s on cold start.
 */
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    // ObjectProvider resolves UserService on first authenticated request,
    // not at Spring context startup.
    private final ObjectProvider<UserService> userServiceProvider;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider,
                                   ObjectProvider<UserService> userServiceProvider) {
        this.tokenProvider = tokenProvider;
        this.userServiceProvider = userServiceProvider;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return "OPTIONS".equalsIgnoreCase(request.getMethod())
                || "/error".equals(path)
                || "/actuator/health".equals(path)
                || path.startsWith("/actuator/health/")
                || "/actuator/info".equals(path)
                || "/auth/login".equals(path)
                || "/auth/register".equals(path)
                || path.startsWith("/auth/oauth/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                Long userId = tokenProvider.getUserIdFromToken(jwt);

                // Resolve UserService lazily on first authenticated request
                UserService userService = userServiceProvider.getObject();
                userService.findById(userId).ifPresentOrElse(user -> {
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            user, null, user.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    log.debug("Authenticated user: {}", user.getEmail());
                }, () -> log.warn("User not found for userId: {}", userId));

            } else if (StringUtils.hasText(jwt)) {
                log.warn("JWT validation failed — invalid or expired token");
            }
        } catch (Exception ex) {
            log.error("JWT Authentication error: {}", ex.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }

        // Also check for token in cookie
        if (request.getCookies() != null) {
            for (var cookie : request.getCookies()) {
                if ("token".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }

        return null;
    }
}
