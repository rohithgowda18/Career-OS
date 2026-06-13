package com.eventtracker.controller;

import com.eventtracker.entity.User;
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

    @GetMapping("/applications/summary")
    @Operation(operationId = "getApplicationSummary", summary = "Get event applications summary metrics")
    public ResponseEntity<Map<String, Object>> getApplicationSummary() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(analyticsService.getSummary(userId));
    }

    @GetMapping("/applications/status-distribution")
    @Operation(operationId = "getApplicationStatusDistribution", summary = "Get event applications status distribution data")
    public ResponseEntity<Map<String, Object>> getApplicationStatusDistribution() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(analyticsService.getStatusDistribution(userId));
    }

    @GetMapping("/applications/conversion-rates")
    @Operation(operationId = "getApplicationConversionRates", summary = "Get event applications acceptance rates data")
    public ResponseEntity<Map<String, Object>> getApplicationConversionRates() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(analyticsService.getAcceptanceRates(userId));
    }

    @GetMapping("/placements/summary")
    @Operation(operationId = "getPlacementSummary", summary = "Get placement applications summary metrics")
    public ResponseEntity<Map<String, Object>> getPlacementSummary() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(analyticsService.getPlacementSummary(userId));
    }

    @GetMapping("/placements/status-distribution")
    @Operation(operationId = "getPlacementStatusDistribution", summary = "Get placement applications status distribution data")
    public ResponseEntity<Map<String, Long>> getPlacementStatusDistribution() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(analyticsService.getPlacementStatusDistribution(userId));
    }

    @GetMapping("/placements/conversion-rates")
    @Operation(operationId = "getPlacementConversionRates", summary = "Get placement stage conversion rates data")
    public ResponseEntity<Map<String, Object>> getPlacementConversionRates() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(analyticsService.getPlacementConversionRates(userId));
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
        User user = (User) authentication.getPrincipal();
        return user.getId();
    }
}
