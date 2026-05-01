package com.eventtracker.controller;

import com.eventtracker.dto.ApplicationDTO;
import com.eventtracker.entity.Application;
import com.eventtracker.entity.User;
import com.eventtracker.service.ApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/applications")
@RequiredArgsConstructor
@CrossOrigin
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
    public ResponseEntity<List<ApplicationDTO>> list() {
        User user = getCurrentUser();
        List<ApplicationDTO> applications = applicationService.getUserApplications(user.getId());
        return ResponseEntity.ok(applications);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        User user = getCurrentUser();
        Optional<Application> application = applicationService.findById(id, user.getId());
        if (application.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Application not found");
        }
        return ResponseEntity.ok(applicationService.convertToDTO(application.get()));
    }

    @PostMapping
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

    @GetMapping("/status/{status}")
    public ResponseEntity<List<ApplicationDTO>> getByStatus(@PathVariable String status) {
        User user = getCurrentUser();
        List<ApplicationDTO> applications = applicationService.getUserApplicationsByStatus(user.getId(), status);
        return ResponseEntity.ok(applications);
    }
}
