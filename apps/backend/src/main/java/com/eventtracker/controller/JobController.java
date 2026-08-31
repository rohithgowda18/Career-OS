package com.eventtracker.controller;

import com.eventtracker.dto.SaveJobRequest;
import com.eventtracker.dto.SavedJobResponse;
import com.eventtracker.security.UserPrincipal;
import com.eventtracker.service.JobService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
@Tag(name = "Saved Jobs", description = "Endpoints for user saved jobs persistence in Career Service")
public class JobController {

    private final JobService jobService;

    private Long getRequiredUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof UserPrincipal) {
                return ((UserPrincipal) principal).getId();
            }
        }
        throw new RuntimeException("User not authenticated");
    }

    @GetMapping("/saved")
    @Operation(summary = "List saved jobs for authenticated user")
    public ResponseEntity<?> getSavedJobs(Pageable pageable) {
        try {
            Long userId = getRequiredUserId();
            Page<SavedJobResponse> savedJobs = jobService.getSavedJobs(userId, pageable);
            return ResponseEntity.ok(savedJobs);
        } catch (Exception e) {
            log.error("Error fetching saved jobs", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "UNAUTHORIZED", "message", e.getMessage()));
        }
    }

    @PostMapping("/saved")
    @Operation(summary = "Save a job opportunity (idempotent)")
    public ResponseEntity<?> saveJob(@Valid @RequestBody SaveJobRequest request) {
        try {
            Long userId = getRequiredUserId();
            SavedJobResponse savedJob = jobService.saveJob(userId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedJob);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "BAD_REQUEST", "message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error saving job", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "SERVER_ERROR", "message", e.getMessage()));
        }
    }

    @DeleteMapping("/saved/{id}")
    @Operation(summary = "Remove a saved job")
    public ResponseEntity<?> deleteSavedJob(@PathVariable Long id) {
        try {
            Long userId = getRequiredUserId();
            jobService.deleteSavedJob(userId, id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "NOT_FOUND", "message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error deleting saved job", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "SERVER_ERROR", "message", e.getMessage()));
        }
    }
}
