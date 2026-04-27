package com.eventtracker.controller;

import com.eventtracker.entity.CalendarConflict;
import com.eventtracker.entity.User;
import com.eventtracker.service.ConflictDetectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/calendar")
@RequiredArgsConstructor
@CrossOrigin
public class CalendarController {

    private final ConflictDetectionService conflictDetectionService;

    @GetMapping("/conflicts")
    public ResponseEntity<List<CalendarConflict>> getConflicts() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(conflictDetectionService.getUnresolvedConflicts(userId));
    }

    @PostMapping("/detect")
    public ResponseEntity<List<CalendarConflict>> detectConflicts(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(conflictDetectionService.detectAndStoreConflicts(userId, start, end));
    }

    @PostMapping("/resolve/{conflictId}")
    public ResponseEntity<?> resolveConflict(@PathVariable Long conflictId) {
        conflictDetectionService.resolveConflict(conflictId);
        return ResponseEntity.ok("Conflict marked as resolved");
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = (User) authentication.getPrincipal();
        return user.getId();
    }
}
