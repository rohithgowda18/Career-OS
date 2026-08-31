package com.eventtracker.controller;

import com.eventtracker.dto.JobDTO;
import com.eventtracker.dto.JobSearchCriteria;
import com.eventtracker.dto.JobSearchResult;
import com.eventtracker.entity.Application;
import com.eventtracker.entity.SavedJob;
import com.eventtracker.security.UserPrincipal;
import com.eventtracker.service.JobService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
@Tag(name = "Jobs", description = "Job discovery, saved jobs, and application tracking")
public class JobController {

    private final JobService jobService;

    private Long getCurrentUserIdOrNull() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof UserPrincipal) {
                return ((UserPrincipal) principal).getId();
            }
        }
        return null;
    }

    private Long getRequiredUserId() {
        Long userId = getCurrentUserIdOrNull();
        if (userId == null) {
            throw new RuntimeException("User not authenticated");
        }
        return userId;
    }

    @GetMapping
    @Operation(summary = "Search live external jobs", description = "Query real external job opportunities with filters and pagination")
    public ResponseEntity<?> searchJobs(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String jobType,
            @RequestParam(required = false) String experienceLevel,
            @RequestParam(required = false) String workMode,
            @RequestParam(required = false) String company,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Long userId = getCurrentUserIdOrNull();
            JobSearchCriteria criteria = JobSearchCriteria.builder()
                    .keyword(keyword)
                    .location(location)
                    .jobType(jobType)
                    .experienceLevel(experienceLevel)
                    .workMode(workMode)
                    .company(company)
                    .sortBy(sortBy)
                    .page(page)
                    .size(size)
                    .build();

            JobSearchResult result = jobService.searchJobs(criteria, userId);
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            log.warn("Job provider configuration error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "SERVICE_UNAVAILABLE", "message", e.getMessage()));
        } catch (Exception e) {
            log.error("Failed to fetch jobs from provider", e);
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("error", "PROVIDER_ERROR", "message", "Unable to load jobs right now. " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get job details by external ID")
    public ResponseEntity<?> getJobDetails(@PathVariable String id) {
        try {
            Long userId = getCurrentUserIdOrNull();
            Optional<JobDTO> job = jobService.getJobById(id, userId);
            if (job.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "NOT_FOUND", "message", "Job opportunity not found or no longer available"));
            }
            return ResponseEntity.ok(job.get());
        } catch (Exception e) {
            log.error("Error retrieving job details", e);
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("error", "PROVIDER_ERROR", "message", "Unable to fetch job details: " + e.getMessage()));
        }
    }

    @GetMapping("/saved")
    @Operation(summary = "List saved jobs for authenticated user")
    public ResponseEntity<?> getSavedJobs(Pageable pageable) {
        try {
            Long userId = getRequiredUserId();
            Page<JobDTO> savedJobs = jobService.getSavedJobs(userId, pageable);
            return ResponseEntity.ok(savedJobs);
        } catch (Exception e) {
            log.error("Error fetching saved jobs", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "UNAUTHORIZED", "message", e.getMessage()));
        }
    }

    @PostMapping("/saved")
    @Operation(summary = "Save a job opportunity")
    public ResponseEntity<?> saveJob(@RequestBody JobDTO dto) {
        try {
            Long userId = getRequiredUserId();
            SavedJob savedJob = jobService.saveJob(userId, dto);
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

    @PostMapping("/track")
    @Operation(summary = "Track a job as an application in Career OS")
    public ResponseEntity<?> trackApplication(
            @RequestBody JobDTO jobDTO,
            @RequestParam(defaultValue = "Applied") String status) {
        try {
            Long userId = getRequiredUserId();
            Application createdApp = jobService.trackJobAsApplication(userId, jobDTO, status);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdApp);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "BAD_REQUEST", "message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error tracking job application", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "TRACKING_ERROR", "message", e.getMessage()));
        }
    }
}
