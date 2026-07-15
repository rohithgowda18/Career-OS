package com.eventtracker.controller;

import com.eventtracker.dto.CreateSkillRequest;
import com.eventtracker.dto.SkillDTO;
import com.eventtracker.dto.UpdateSkillRequest;
import com.eventtracker.entity.Skill;
import com.eventtracker.entity.User;
import com.eventtracker.service.SkillService;
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

import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/skills")
@RequiredArgsConstructor
public class SkillController {
    private final SkillService skillService;

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            return (User) authentication.getPrincipal();
        }
        throw new RuntimeException("User not authenticated");
    }

    @PostMapping
    @Operation(operationId = "createSkill", summary = "Create a new user skill")
    public ResponseEntity<?> create(@Valid @RequestBody CreateSkillRequest request) {
        try {
            User user = getCurrentUser();
            Skill skill = skillService.createSkill(user, request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(skillService.convertToDTO(skill));
        } catch (Exception e) {
            log.error("Error creating skill", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping
    @Operation(operationId = "listSkills", summary = "List skills with search parameter and pagination")
    public ResponseEntity<?> list(
            @RequestParam(required = false) String search,
            Pageable pageable) {
        try {
            User user = getCurrentUser();
            return ResponseEntity.ok(skillService.getUserSkills(user.getId(), search, pageable));
        } catch (Exception e) {
            log.error("Error listing skills", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    @Operation(operationId = "getSkill", summary = "Get a skill by ID")
    public ResponseEntity<?> get(@PathVariable Long id) {
        try {
            User user = getCurrentUser();
            Optional<Skill> skill = skillService.getSkillById(id, user.getId());
            if (skill.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Skill not found");
            }
            return ResponseEntity.ok(skillService.convertToDTO(skill.get()));
        } catch (Exception e) {
            log.error("Error fetching skill", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @Operation(operationId = "updateSkill", summary = "Update an existing skill")
    public ResponseEntity<?> update(@PathVariable Long id, @Valid @RequestBody UpdateSkillRequest request) {
        try {
            User user = getCurrentUser();
            Skill skill = skillService.updateSkill(id, user.getId(), request);
            return ResponseEntity.ok(skillService.convertToDTO(skill));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            log.error("Error updating skill", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @Operation(operationId = "deleteSkill", summary = "Delete a skill")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            User user = getCurrentUser();
            skillService.deleteSkill(id, user.getId());
            return ResponseEntity.ok("Skill deleted successfully");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            log.error("Error deleting skill", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}
