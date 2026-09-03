package com.careeros.coding.controller;

import com.careeros.coding.dto.*;
import com.careeros.coding.security.UserPrincipal;
import com.careeros.coding.service.CodingProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/coding")
@RequiredArgsConstructor
@Tag(name = "Coding Profile", description = "Coding platform profiles, verification, stats, and history")
public class CodingProfileController {

    private final CodingProfileService codingProfileService;

    private Long getRequiredUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof UserPrincipal) {
                return ((UserPrincipal) principal).getId();
            }
        }
        throw new RuntimeException("User is not authenticated");
    }

    @PostMapping("/accounts")
    @Operation(summary = "Connect a coding platform account", description = "Generates a verification code to confirm ownership via profile bio")
    public ResponseEntity<?> connectAccount(@Valid @RequestBody ConnectAccountRequest request) {
        try {
            Long userId = getRequiredUserId();
            ConnectAccountResponse response = codingProfileService.connectAccount(userId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "BAD_REQUEST", "message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "CONFLICT", "message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error connecting coding account", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "SERVER_ERROR", "message", e.getMessage()));
        }
    }

    @PostMapping("/accounts/{id}/verify")
    @Operation(summary = "Verify account ownership", description = "Checks the public profile bio for the generated verification code")
    public ResponseEntity<?> verifyOwnership(@PathVariable Long id) {
        try {
            Long userId = getRequiredUserId();
            CodingStatsResponse response = codingProfileService.verifyOwnership(userId, id);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "VERIFICATION_FAILED", "message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "INVALID_STATE", "message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error verifying coding account", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "SERVER_ERROR", "message", e.getMessage()));
        }
    }

    @PostMapping("/accounts/{id}/sync")
    @Operation(summary = "Synchronize coding stats", description = "Fetches latest stats from coding platform and records a history snapshot")
    public ResponseEntity<?> syncStats(@PathVariable Long id) {
        try {
            Long userId = getRequiredUserId();
            CodingStatsResponse response = codingProfileService.syncStats(userId, id);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "BAD_REQUEST", "message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "SYNC_ERROR", "message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error synchronizing coding stats", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "SERVER_ERROR", "message", e.getMessage()));
        }
    }

    @GetMapping("/stats")
    @Operation(summary = "Get current coding statistics", description = "Returns stored statistics for the authenticated user's connected platforms")
    public ResponseEntity<?> getCurrentStats() {
        try {
            Long userId = getRequiredUserId();
            Map<String, CodingStatsResponse> stats = codingProfileService.getCurrentStats(userId);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error retrieving coding stats", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "SERVER_ERROR", "message", e.getMessage()));
        }
    }

    @GetMapping("/stats/history")
    @Operation(summary = "Get coding statistics history", description = "Returns historical snapshots for progress charts")
    public ResponseEntity<?> getStatsHistory() {
        try {
            Long userId = getRequiredUserId();
            List<CodingStatsHistoryDTO> history = codingProfileService.getStatsHistory(userId);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            log.error("Error retrieving coding stats history", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "SERVER_ERROR", "message", e.getMessage()));
        }
    }

    @GetMapping("/daily")
    @Operation(summary = "Get daily coding challenges across supported platforms", description = "Aggregates live daily coding challenges (POTD) from supported platforms")
    public ResponseEntity<?> getDailyChallenges() {
        try {
            List<DailyChallengeDTO> challenges = codingProfileService.getDailyChallenges();
            return ResponseEntity.ok(challenges);
        } catch (Exception e) {
            log.error("Error retrieving daily challenges", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "SERVER_ERROR", "message", e.getMessage()));
        }
    }

    @GetMapping("/activity")
    @Operation(summary = "Get unified coding activity calendar heatmap", description = "Aggregates daily unique solved problems across connected platforms")
    public ResponseEntity<?> getActivitySummary(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) com.careeros.coding.model.Platform platform) {
        try {
            Long userId = getRequiredUserId();
            ActivitySummaryDTO summary = codingProfileService.getActivitySummary(userId, year, platform);
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            log.error("Error retrieving coding activity summary", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "SERVER_ERROR", "message", e.getMessage()));
        }
    }

    @GetMapping("/accounts")
    @Operation(summary = "List connected coding accounts for authenticated user")
    public ResponseEntity<?> getAccounts() {
        try {
            Long userId = getRequiredUserId();
            List<ConnectAccountResponse> accounts = codingProfileService.getAccounts(userId);
            return ResponseEntity.ok(accounts);
        } catch (Exception e) {
            log.error("Error retrieving coding accounts", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "SERVER_ERROR", "message", e.getMessage()));
        }
    }

    @DeleteMapping("/accounts/{id}")
    @Operation(summary = "Disconnect a coding platform account", description = "Removes the account, current stats, and historical snapshots")
    public ResponseEntity<?> disconnectAccount(@PathVariable Long id) {
        try {
            Long userId = getRequiredUserId();
            codingProfileService.disconnectAccount(userId, id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "NOT_FOUND", "message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error disconnecting coding account", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "SERVER_ERROR", "message", e.getMessage()));
        }
    }
}
