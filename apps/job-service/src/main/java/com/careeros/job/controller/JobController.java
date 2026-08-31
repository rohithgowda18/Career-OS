package com.careeros.job.controller;

import com.careeros.job.dto.JobDTO;
import com.careeros.job.dto.JobSearchRequest;
import com.careeros.job.dto.JobSearchResponse;
import com.careeros.job.exception.JobProviderException;
import com.careeros.job.service.JobService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
@Tag(name = "Jobs", description = "Job discovery and search aggregation endpoints")
public class JobController {

    private final JobService jobService;

    @GetMapping
    @Operation(summary = "Search live job opportunities", description = "Query vetted jobs using keyword, location, posting age, and limit")
    public ResponseEntity<?> searchJobs(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String jobType,
            @RequestParam(required = false) String experienceLevel,
            @RequestParam(required = false) String workMode,
            @RequestParam(required = false) Integer days,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            String effectiveKeyword = (keyword != null && !keyword.isBlank()) ? keyword : q;
            JobSearchRequest request = JobSearchRequest.builder()
                    .keyword(effectiveKeyword)
                    .location(location)
                    .jobType(jobType)
                    .experienceLevel(experienceLevel)
                    .workMode(workMode)
                    .days(days)
                    .page(page)
                    .size(size)
                    .build();

            JobSearchResponse response = jobService.searchJobs(request);
            return ResponseEntity.ok(response);
        } catch (JobProviderException e) {
            log.warn("Job provider error (status: {}, code: {}): {}", e.getStatusCode(), e.getErrorCode(), e.getMessage());
            return ResponseEntity.status(e.getStatusCode())
                    .body(Map.of(
                            "error", e.getErrorCode(),
                            "message", e.getMessage(),
                            "status", e.getStatusCode()
                    ));
        } catch (Exception e) {
            log.error("Unexpected error during job search", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", "INTERNAL_ERROR",
                            "message", "An unexpected error occurred while searching jobs.",
                            "status", 500
                    ));
        }
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get full job details", description = "Retrieve full structured details for a specific job ID")
    public ResponseEntity<?> getJobDetails(@PathVariable String id) {
        try {
            Optional<JobDTO> job = jobService.getJobById(id);
            if (job.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of(
                                "error", "NOT_FOUND",
                                "message", "Job not found or no longer active on the provider.",
                                "status", 404
                        ));
            }
            return ResponseEntity.ok(job.get());
        } catch (JobProviderException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .body(Map.of(
                            "error", e.getErrorCode(),
                            "message", e.getMessage(),
                            "status", e.getStatusCode()
                    ));
        } catch (Exception e) {
            log.error("Unexpected error retrieving job details for ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", "INTERNAL_ERROR",
                            "message", "An unexpected error occurred while retrieving job details.",
                            "status", 500
                    ));
        }
    }
}
