package com.eventtracker.security;

import java.util.Date;

import javax.crypto.SecretKey;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class JwtTokenProvider {

    @Value("${app.jwt.secret:your-secret-key-change-this-in-production}")
    private String jwtSecret;

    @Value("${app.jwt.expiration:86400000}")
    private long jwtExpirationMillis;

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

    public String generateToken(Long userId, String email) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMillis);

        return Jwts.builder()
                .claim("userId", userId)
                .claim("email", email)
                .setSubject(userId.toString())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();
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

    public long getJwtExpirationMillis() {
        return jwtExpirationMillis;
    }
}
