package com.careeros.coding.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;

@Service
@RequiredArgsConstructor
public class JwtTokenProvider {

    @Value("${app.jwt.secret:your-super-secret-jwt-key-with-at-least-64-bytes-for-hs512-signing-career-os-2026}")
    private String jwtSecret;

    @PostConstruct
    void validateConfiguration() {
        if (jwtSecret != null) {
            jwtSecret = jwtSecret.trim();
        }
        if (jwtSecret == null || jwtSecret.getBytes().length < 64) {
            throw new IllegalStateException("JWT_SECRET must be at least 64 bytes for HS512 signing");
        }
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    public Claims parseToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (Exception e) {
            return null;
        }
    }

    public Long getUserIdFromToken(String token) {
        Claims claims = parseToken(token);
        return claims != null ? claims.get("userId", Long.class) : null;
    }

    public String getEmailFromToken(String token) {
        Claims claims = parseToken(token);
        return claims != null ? claims.get("email", String.class) : null;
    }

    public boolean validateToken(String token) {
        return parseToken(token) != null;
    }
}
