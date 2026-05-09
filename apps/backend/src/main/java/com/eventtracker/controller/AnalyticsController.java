package com.eventtracker.controller;

import com.eventtracker.entity.User;
import com.eventtracker.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(analyticsService.getSummary(userId));
    }

    @GetMapping("/distribution")
    public ResponseEntity<Map<String, Object>> getStatusDistribution() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(analyticsService.getStatusDistribution(userId));
    }

    @GetMapping("/rates")
    public ResponseEntity<Map<String, Object>> getAcceptanceRates() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(analyticsService.getAcceptanceRates(userId));
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = (User) authentication.getPrincipal();
        return user.getId();
    }
}
