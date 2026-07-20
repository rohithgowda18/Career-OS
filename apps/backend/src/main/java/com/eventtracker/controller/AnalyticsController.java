package com.eventtracker.controller;

import com.eventtracker.entity.User;
import com.eventtracker.security.UserPrincipal;
import com.eventtracker.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
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
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/applications")
    @Operation(operationId = "getApplicationAnalytics", summary = "Get combined event applications analytics")
    public ResponseEntity<Map<String, Object>> getApplicationAnalytics() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(analyticsService.getApplicationAnalytics(userId));
    }

    @GetMapping("/placements")
    @Operation(operationId = "getPlacementAnalytics", summary = "Get combined placement applications analytics")
    public ResponseEntity<Map<String, Object>> getPlacementAnalytics() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(analyticsService.getPlacementAnalytics(userId));
    }

    @GetMapping("/placements/trends")
    @Operation(operationId = "getPlacementTrends", summary = "Get placement applications trends over time")
    public ResponseEntity<List<Map<String, Object>>> getPlacementTrends() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(analyticsService.getPlacementTrends(userId));
    }

    @GetMapping("/dashboard")
    @Operation(operationId = "getDashboardAnalytics", summary = "Get dashboard aggregate metrics")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(analyticsService.getDashboardData(userId));
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof UserPrincipal) {
                return ((UserPrincipal) principal).getId();
            } else if (principal instanceof User) {
                return ((User) principal).getId();
            }
        }
        throw new RuntimeException("User not authenticated");
    }
}
