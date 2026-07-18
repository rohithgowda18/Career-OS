package com.eventtracker.controller;

import com.eventtracker.dto.RoutineDTO;
import com.eventtracker.dto.RoutineReportDTO;
import com.eventtracker.entity.RoutineTask;
import com.eventtracker.entity.RoutineCompletion;
import com.eventtracker.entity.User;
import com.eventtracker.service.RoutineService;
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

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            return (User) authentication.getPrincipal();
        }
        throw new RuntimeException("User not authenticated");
    }

    @PostMapping
    @Operation(operationId = "createRoutineTask", summary = "Create a reusable daily routine task item")
    public ResponseEntity<?> create(@Valid @RequestBody RoutineDTO dto) {
        User user = getCurrentUser();
        try {
            RoutineTask task = routineService.createTask(user, dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(routineService.convertToDTO(task, false));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    @Operation(operationId = "listRoutineTasks", summary = "List all reusable daily routines with today's completion status")
    public ResponseEntity<List<RoutineDTO>> list() {
        User user = getCurrentUser();
        return ResponseEntity.ok(routineService.getRoutines(user.getId()));
    }

    @PutMapping("/{id}")
    @Operation(operationId = "updateRoutineTask", summary = "Update routine details")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody RoutineDTO dto) {
        User user = getCurrentUser();
        try {
            RoutineTask task = routineService.updateTask(id, user.getId(), dto);
            return ResponseEntity.ok(routineService.convertToDTO(task, false));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/toggle")
    @Operation(operationId = "toggleRoutineTaskCompletion", summary = "Toggle routine completion status for today")
    public ResponseEntity<?> toggle(@PathVariable Long id) {
        User user = getCurrentUser();
        try {
            RoutineCompletion comp = routineService.toggleCompletion(id, user.getId());
            return ResponseEntity.ok(Map.of("completed", comp.isCompleted()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @Operation(operationId = "deleteRoutineTask", summary = "Delete routine item")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        User user = getCurrentUser();
        try {
            routineService.deleteTask(id, user.getId());
            return ResponseEntity.ok(Map.of("message", "Routine task deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/reports")
    @Operation(operationId = "getRoutineTaskReports", summary = "Get daily routine statistics and progress reports")
    public ResponseEntity<RoutineReportDTO> getReports() {
        User user = getCurrentUser();
        return ResponseEntity.ok(routineService.getReports(user.getId()));
    }
}
