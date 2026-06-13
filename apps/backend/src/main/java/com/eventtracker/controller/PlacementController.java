package com.eventtracker.controller;

import com.eventtracker.dto.PlacementDTO;
import com.eventtracker.entity.Placement;
import com.eventtracker.entity.User;
import com.eventtracker.service.PlacementService;
import com.eventtracker.service.GeminiExtractionService;
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
import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/placements")
@RequiredArgsConstructor
public class PlacementController {
    
    private final PlacementService placementService;
    private final GeminiExtractionService geminiExtractionService;

    @PostMapping("/extract")
    @Operation(operationId = "extractPlacement", summary = "Extract placement details using AI")
    public ResponseEntity<?> extract(@RequestBody Map<String, String> request) {
        String emailContent = request.get("emailContent");
        if (emailContent == null || emailContent.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("emailContent is required");
        }
        try {
            PlacementDTO result = geminiExtractionService.extractPlacementDetails(emailContent);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("AI Extraction failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to extract placement details: " + e.getMessage());
        }
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            return (User) authentication.getPrincipal();
        }
        throw new RuntimeException("User not authenticated");
    }

    @GetMapping
    @Operation(operationId = "listPlacements", summary = "List placements with optional status filtering and full-text search")
    public ResponseEntity<?> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            Pageable pageable) {
        User user = getCurrentUser();
        return ResponseEntity.ok(placementService.getUserPlacements(user.getId(), status, search, pageable));
    }

    @GetMapping("/{id}")
    @Operation(operationId = "getPlacement", summary = "Get a placement by ID")
    public ResponseEntity<?> get(@PathVariable Long id) {
        User user = getCurrentUser();
        Optional<Placement> placement = placementService.findById(id, user.getId());
        if (placement.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Placement not found");
        }
        return ResponseEntity.ok(placementService.convertToDTO(placement.get()));
    }

    @PostMapping
    @Operation(operationId = "createPlacement", summary = "Create a new placement record")
    public ResponseEntity<?> create(@Valid @RequestBody PlacementDTO request) {
        try {
            User user = getCurrentUser();
            Placement placement = placementService.createPlacement(user, request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(placementService.convertToDTO(placement));
        } catch (Exception e) {
            log.error("Error creating placement", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @Operation(operationId = "updatePlacement", summary = "Update an existing placement record")
    public ResponseEntity<?> update(@PathVariable Long id, @Valid @RequestBody PlacementDTO request) {
        try {
            User user = getCurrentUser();
            Placement placement = placementService.updatePlacement(id, user.getId(), request);
            return ResponseEntity.ok(placementService.convertToDTO(placement));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            log.error("Error updating placement", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @Operation(operationId = "deletePlacement", summary = "Delete a placement record")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            User user = getCurrentUser();
            placementService.deletePlacement(id, user.getId());
            return ResponseEntity.ok("Placement deleted successfully");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            log.error("Error deleting placement", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}
