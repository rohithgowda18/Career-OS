package com.eventtracker.controller;

import com.eventtracker.dto.ApplicationDTO;
import com.eventtracker.entity.Application;
import com.eventtracker.entity.User;
import com.eventtracker.service.ApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            return (User) authentication.getPrincipal();
        }
        throw new RuntimeException("User not authenticated");
    }

    @GetMapping
    @Operation(operationId = "listApplications", summary = "List event applications with optional status filtering and full-text search")
    public ResponseEntity<?> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            Pageable pageable) {
        User user = getCurrentUser();
        return ResponseEntity.ok(applicationService.getUserApplications(user.getId(), status, search, pageable));
    }

    @GetMapping("/{id}")
    @Operation(operationId = "getApplication", summary = "Get an event application by ID")
    public ResponseEntity<?> get(@PathVariable Long id) {
        User user = getCurrentUser();
        Optional<Application> application = applicationService.findById(id, user.getId());
        if (application.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Application not found");
        }
        return ResponseEntity.ok(applicationService.convertToDTO(application.get()));
    }

    @PostMapping
    @Operation(operationId = "createApplication", summary = "Create a new event application")
    public ResponseEntity<?> create(@Valid @RequestBody ApplicationDTO dto) {
        try {
            User user = getCurrentUser();
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
            User user = getCurrentUser();
            Application application = applicationService.updateApplication(id, user.getId(), dto);
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
            User user = getCurrentUser();
            applicationService.deleteApplication(id, user.getId());
            return ResponseEntity.ok("Application deleted successfully");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            log.error("Error deleting application", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}
