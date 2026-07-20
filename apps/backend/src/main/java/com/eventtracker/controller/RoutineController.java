package com.eventtracker.controller;

import com.eventtracker.dto.RoutineDTO;
import com.eventtracker.dto.RoutineReportDTO;
import com.eventtracker.entity.RoutineTask;
import com.eventtracker.entity.RoutineCompletion;
import com.eventtracker.entity.User;
import com.eventtracker.service.RoutineService;
import com.eventtracker.service.UserService;
import com.eventtracker.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/routines")
@RequiredArgsConstructor
public class RoutineController {

    private final RoutineService routineService;
    private final UserService userService;

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

    @PostMapping
    @Operation(operationId = "createRoutineTask", summary = "Create a reusable daily routine task item")
    public ResponseEntity<?> create(@Valid @RequestBody RoutineDTO dto) {
        try {
            Long userId = getCurrentUserId();
            User user = userService.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
            RoutineTask task = routineService.createTask(user, dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(routineService.convertToDTO(task, false));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    @Operation(operationId = "listRoutineTasks", summary = "List all reusable daily routines with today's completion status")
    public ResponseEntity<List<RoutineDTO>> list() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(routineService.getRoutines(userId));
    }

    @PutMapping("/{id}")
    @Operation(operationId = "updateRoutineTask", summary = "Update routine details")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody RoutineDTO dto) {
        Long userId = getCurrentUserId();
        try {
            RoutineTask task = routineService.updateTask(id, userId, dto);
            return ResponseEntity.ok(routineService.convertToDTO(task, false));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/toggle")
    @Operation(operationId = "toggleRoutineTaskCompletion", summary = "Toggle routine completion status for today")
    public ResponseEntity<?> toggle(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        try {
            RoutineCompletion comp = routineService.toggleCompletion(id, userId);
            return ResponseEntity.ok(Map.of("completed", comp.isCompleted()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @Operation(operationId = "deleteRoutineTask", summary = "Delete routine item")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        try {
            routineService.deleteTask(id, userId);
            return ResponseEntity.ok(Map.of("message", "Task deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/reports")
    @Operation(operationId = "getRoutineReports", summary = "Get routine completion stats and streaks")
    public ResponseEntity<RoutineReportDTO> reports() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(routineService.getReports(userId));
    }
}
