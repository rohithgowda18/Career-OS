package com.eventtracker.controller;

import com.eventtracker.entity.EventSuccessScore;
import com.eventtracker.entity.User;
import com.eventtracker.repository.EventSuccessScoreRepository;
import com.eventtracker.service.SuccessScoringService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/scoring")
@RequiredArgsConstructor
@CrossOrigin
public class SuccessScoringController {

    private final SuccessScoringService scoringService;
    private final EventSuccessScoreRepository scoreRepository;

    @PostMapping("/calculate/{applicationId}")
    public ResponseEntity<EventSuccessScore> calculateScore(@PathVariable Long applicationId) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(scoringService.calculateAndStoreScore(userId, applicationId));
    }

    @GetMapping("/application/{applicationId}")
    public ResponseEntity<EventSuccessScore> getApplicationScore(@PathVariable Long applicationId) {
        Long userId = getCurrentUserId();
        return ResponseEntity.of(scoreRepository.findByApplicationIdAndUserId(applicationId, userId));
    }

    @GetMapping("/me")
    public ResponseEntity<List<EventSuccessScore>> getUserScores() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(scoreRepository.findByUserId(userId));
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = (User) authentication.getPrincipal();
        return user.getId();
    }
}
