package com.eventtracker.controller;

import com.eventtracker.dto.ImportRequestDTO;
import com.eventtracker.service.ImportService;
import com.eventtracker.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/import")
@RequiredArgsConstructor
public class ImportController {

    private final ImportService importService;

    @PostMapping("/text")
    public ResponseEntity<?> importText(@AuthenticationPrincipal Object principal,
                                        @Valid @RequestBody ImportRequestDTO request) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        Long userId = null;
        if (principal instanceof UserPrincipal) {
            userId = ((UserPrincipal) principal).getId();
        }

        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        try {
            Map<String, Object> result = importService.importContent(userId, request);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Manual content import failed for user: {}", userId, e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to process import content: " + e.getMessage()));
        }
    }
}
