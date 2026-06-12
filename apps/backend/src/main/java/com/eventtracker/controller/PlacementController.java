package com.eventtracker.controller;

import com.eventtracker.dto.CreatePlacementRequest;
import com.eventtracker.dto.UpdatePlacementRequest;
import com.eventtracker.dto.PlacementDTO;
import com.eventtracker.entity.Placement;
import com.eventtracker.entity.User;
import com.eventtracker.service.PlacementService;
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
@RequestMapping({"/api/placements", "/placements"})
@RequiredArgsConstructor
public class PlacementController {
    
    private final PlacementService placementService;

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            return (User) authentication.getPrincipal();
        }
        throw new RuntimeException("User not authenticated");
    }

    @GetMapping
    public ResponseEntity<?> list(Pageable pageable) {
        User user = getCurrentUser();
        return ResponseEntity.ok(placementService.getUserPlacements(user.getId(), pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        User user = getCurrentUser();
        Optional<Placement> placement = placementService.findById(id, user.getId());
        if (placement.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Placement not found");
        }
        return ResponseEntity.ok(placementService.convertToDTO(placement.get()));
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody CreatePlacementRequest request) {
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
    public ResponseEntity<?> update(@PathVariable Long id, @Valid @RequestBody UpdatePlacementRequest request) {
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

    @GetMapping("/status/{status}")
    public ResponseEntity<List<PlacementDTO>> getByStatus(@PathVariable String status) {
        User user = getCurrentUser();
        List<PlacementDTO> placements = placementService.getUserPlacementsByStatus(user.getId(), status);
        return ResponseEntity.ok(placements);
    }
}
