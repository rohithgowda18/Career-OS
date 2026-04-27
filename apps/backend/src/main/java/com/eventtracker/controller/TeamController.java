package com.eventtracker.controller;

import com.eventtracker.entity.Team;
import com.eventtracker.entity.TeamMember;
import com.eventtracker.entity.User;
import com.eventtracker.service.TeamService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/teams")
@RequiredArgsConstructor
@CrossOrigin
public class TeamController {

    private final TeamService teamService;

    @PostMapping
    public ResponseEntity<Team> createTeam(@RequestParam Long applicationId, 
                                         @RequestParam String name, 
                                         @RequestParam(required = false) String description,
                                         @RequestParam(required = false) Integer maxMembers) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(teamService.createTeam(applicationId, userId, name, description, maxMembers));
    }

    @GetMapping("/application/{applicationId}")
    public ResponseEntity<List<Team>> getTeamsForApplication(@PathVariable Long applicationId) {
        return ResponseEntity.ok(teamService.getTeamsForApplication(applicationId));
    }

    @PostMapping("/{teamId}/join")
    public ResponseEntity<?> joinTeam(@PathVariable Long teamId, @RequestParam(required = false) String role) {
        Long userId = getCurrentUserId();
        teamService.addMember(teamId, userId, role);
        return ResponseEntity.ok("Successfully joined team");
    }

    @DeleteMapping("/{teamId}/leave")
    public ResponseEntity<?> leaveTeam(@PathVariable Long teamId) {
        Long userId = getCurrentUserId();
        teamService.removeMember(teamId, userId);
        return ResponseEntity.ok("Successfully left team");
    }

    @GetMapping("/me")
    public ResponseEntity<List<TeamMember>> getUserTeams() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(teamService.getUserTeams(userId));
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = (User) authentication.getPrincipal();
        return user.getId();
    }
}
