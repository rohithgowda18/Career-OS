package com.careeros.coding.controller;

import com.careeros.coding.dto.*;
import com.careeros.coding.model.Platform;
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
@Tag(name = "Coding Profile", description = "Multi-platform coding profile management, daily activity heatmap, and challenges")
public class CodingProfileController {

    private final CodingProfileService codingProfileService;

    @PostMapping("/accounts")
    @Operation(summary = "Connect coding platform account and generate verification code")
    public ResponseEntity<?> connectAccount(@Valid @RequestBody ConnectAccountRequest request) {
        try {
            Long userId = getRequiredUserId();
            ConnectAccountResponse response = codingProfileService.connectAccount(userId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "VALIDATION_ERROR", "message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error connecting coding account", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "SERVER_ERROR", "message", e.getMessage()));
        }
    }

    @PostMapping("/accounts/{id}/verify")
    @Operation(summary = "Verify account ownership via bio code match")
    public ResponseEntity<?> verifyOwnership(@PathVariable("id") Long accountId) {
        try {
            Long userId = getRequiredUserId();
            CodingStatsResponse response = codingProfileService.verifyOwnership(userId, accountId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "VERIFICATION_FAILED", "message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.GONE)
                    .body(Map.of("error", "CODE_EXPIRED", "message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error verifying coding account {}", accountId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "SERVER_ERROR", "message", e.getMessage()));
        }
    }

    @PostMapping("/accounts/{id}/sync")
    @Operation(summary = "Sync current statistics and daily activities from coding platform")
    public ResponseEntity<?> syncStats(@PathVariable("id") Long accountId) {
        try {
            Long userId = getRequiredUserId();
            CodingStatsResponse response = codingProfileService.syncStats(userId, accountId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "SYNC_FAILED", "message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "ACCOUNT_NOT_VERIFIED", "message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error syncing stats for coding account {}", accountId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "SERVER_ERROR", "message", e.getMessage()));
        }
    }

    @GetMapping("/stats")
    @Operation(summary = "Get current coding stats keyed by platform")
    public ResponseEntity<?> getCurrentStats() {
        try {
            Long userId = getRequiredUserId();
            Map<String, CodingStatsResponse> statsMap = codingProfileService.getCurrentStats(userId);
            return ResponseEntity.ok(statsMap);
        } catch (Exception e) {
            log.error("Error retrieving coding stats", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "SERVER_ERROR", "message", e.getMessage()));
        }
    }

    @GetMapping("/activity")
    @Operation(summary = "Get daily unique problems solved across platforms for heatmap")
    public ResponseEntity<?> getDailyActivities(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Platform platform) {
        try {
            Long userId = getRequiredUserId();
            List<DailyActivityDTO> activities = codingProfileService.getDailyActivities(userId, year, platform);
            return ResponseEntity.ok(activities);
        } catch (Exception e) {
            log.error("Error retrieving coding activities", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "SERVER_ERROR", "message", e.getMessage()));
        }
    }

    @GetMapping("/daily")
    @Operation(summary = "Get today's coding challenges across platforms")
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

    @GetMapping("/accounts")
    @Operation(summary = "List connected coding accounts for authenticated user")
    public ResponseEntity<?> getAccounts() {
        try {
            Long userId = getRequiredUserId();
            List<ConnectAccountResponse> accounts = codingProfileService.getAccounts(userId);
            return ResponseEntity.ok(accounts);
        } catch (Exception e) {
            log.error("Error listing coding accounts", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "SERVER_ERROR", "message", e.getMessage()));
        }
    }

    @DeleteMapping("/accounts/{id}")
    @Operation(summary = "Disconnect coding platform account")
    public ResponseEntity<?> disconnectAccount(@PathVariable("id") Long accountId) {
        try {
            Long userId = getRequiredUserId();
            codingProfileService.disconnectAccount(userId, accountId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "NOT_FOUND", "message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error disconnecting coding account {}", accountId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "SERVER_ERROR", "message", e.getMessage()));
        }
    }

    private Long getRequiredUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            return principal.getId();
        }
        throw new IllegalStateException("Unauthorized: No authenticated user session found.");
    }
}
