package com.eventtracker.controller;

import com.eventtracker.dto.ApplicationDTO;
import com.eventtracker.entity.Application;
import com.eventtracker.entity.User;
import com.eventtracker.service.ApplicationService;
import com.eventtracker.service.GeminiExtractionService;
import com.eventtracker.service.UserService;
import com.eventtracker.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
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

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;
    private final GeminiExtractionService geminiExtractionService;
    private final UserService userService;

    @PostMapping("/extract")
    @Operation(operationId = "extractApplication", summary = "Extract application details using AI")
    public ResponseEntity<?> extract(@RequestBody Map<String, String> request) {
        String emailContent = request.get("emailContent");
        if (emailContent == null || emailContent.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("emailContent is required");
        }
        if (emailContent.length() > 10000) {
            return ResponseEntity.badRequest().body("emailContent length exceeds limit of 10000 characters");
        }
        try {
            ApplicationDTO result = geminiExtractionService.extractApplicationDetails(emailContent);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("AI Extraction failed for application", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to extract application details: " + e.getMessage());
        }
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

    @GetMapping
    @Operation(operationId = "listApplications", summary = "List event applications with optional status and event type filtering")
    public ResponseEntity<Page<ApplicationDTO>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String eventType,
            Pageable pageable) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(applicationService.getUserApplications(userId, status, eventType, pageable));
    }

    @GetMapping("/{id}")
    @Operation(operationId = "getApplication", summary = "Get an event application by ID")
    public ResponseEntity<?> get(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        Optional<Application> application = applicationService.findById(id, userId);
        if (application.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Application not found");
        }
        return ResponseEntity.ok(applicationService.convertToDTO(application.get()));
    }

    @PostMapping
    @Operation(operationId = "createApplication", summary = "Create a new event application")
    public ResponseEntity<?> create(@Valid @RequestBody ApplicationDTO dto) {
        try {
            Long userId = getCurrentUserId();
            User user = userService.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
            Application application = applicationService.createApplication(user, dto);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(applicationService.convertToDTO(application));
        } catch (Exception e) {
            log.error("Error creating application", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @Operation(operationId = "updateApplication", summary = "Update an existing event application")
    public ResponseEntity<?> update(@PathVariable Long id, @Valid @RequestBody ApplicationDTO dto) {
        try {
            Long userId = getCurrentUserId();
            Application application = applicationService.updateApplication(id, userId, dto);
            return ResponseEntity.ok(applicationService.convertToDTO(application));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            log.error("Error updating application", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @Operation(operationId = "deleteApplication", summary = "Delete an event application")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            Long userId = getCurrentUserId();
            applicationService.deleteApplication(id, userId);
            return ResponseEntity.ok("Application deleted successfully");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            log.error("Error deleting application", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}
