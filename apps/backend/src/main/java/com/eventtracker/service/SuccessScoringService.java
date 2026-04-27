package com.eventtracker.service;

import com.eventtracker.entity.Application;
import com.eventtracker.entity.EventSuccessScore;
import com.eventtracker.entity.UserProfile;
import com.eventtracker.repository.ApplicationRepository;
import com.eventtracker.repository.EventSuccessScoreRepository;
import com.eventtracker.repository.UserProfileRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class SuccessScoringService {

    private final EventSuccessScoreRepository scoreRepository;
    private final ApplicationRepository applicationRepository;
    private final UserProfileRepository userProfileRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public EventSuccessScore calculateAndStoreScore(Long userId, Long applicationId) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        if (!application.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized access to application");
        }

        Map<String, Object> factors = new HashMap<>();
        
        // 1. Event type success rate (30%)
        List<Application> userApps = applicationRepository.findByUserId(userId);
        long totalOfThisType = userApps.stream()
                .filter(a -> a.getEventType().equals(application.getEventType()) && !a.getStatus().name().equals("Withdrawn"))
                .count();
        long acceptedOfThisType = userApps.stream()
                .filter(a -> a.getEventType().equals(application.getEventType()) && a.getStatus().name().equals("Accepted"))
                .count();
        
        double eventTypeSuccessRate = totalOfThisType > 0 ? (double) acceptedOfThisType / totalOfThisType * 100 : 65.0;
        factors.put("eventTypeSuccessRate", Math.round(eventTypeSuccessRate));

        // 2. User experience level (25%)
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElse(null);
        String expLevel = profile != null ? profile.getExperienceLevel() : "intermediate";
        Map<String, Double> experienceMap = Map.of(
            "beginner", 60.0,
            "intermediate", 75.0,
            "advanced", 85.0,
            "expert", 95.0
        );
        double userExperienceLevel = experienceMap.getOrDefault(expLevel, 75.0);
        factors.put("userExperienceLevel", Math.round(userExperienceLevel));

        // 3. Overall success rate (20%)
        long totalApps = userApps.stream().filter(a -> !a.getStatus().name().equals("Withdrawn")).count();
        long totalAccepted = userApps.stream().filter(a -> a.getStatus().name().equals("Accepted")).count();
        double totalSuccessRate = totalApps > 0 ? (double) totalAccepted / totalApps * 100 : 50.0;
        factors.put("totalSuccessRate", Math.round(totalSuccessRate));

        // 4. Timeline/urgency (15%)
        double timelineScore = 70.0;
        if (application.getDeadline() != null) {
            long daysUntil = ChronoUnit.DAYS.between(LocalDate.now(), application.getDeadline().toLocalDate());
            if (daysUntil > 21) timelineScore = 90.0;
            else if (daysUntil > 7) timelineScore = 70.0;
            else if (daysUntil > 0) timelineScore = 40.0;
            else timelineScore = 20.0;
        }
        factors.put("timelineScore", Math.round(timelineScore));

        // 5. Historical trend (10%)
        // Simplified trend calculation
        double historicalTrend = 75.0; 
        factors.put("historicalTrend", Math.round(historicalTrend));

        // Final Probability Calculation
        double probability = (eventTypeSuccessRate * 0.3) + 
                             (userExperienceLevel * 0.25) + 
                             (totalSuccessRate * 0.2) + 
                             (timelineScore * 0.15) + 
                             (historicalTrend * 0.1);

        probability = Math.min(Math.max(probability, 0.0), 100.0);

        EventSuccessScore score = scoreRepository.findByApplicationIdAndUserId(applicationId, userId)
                .orElse(new EventSuccessScore());
        
        score.setApplication(application);
        score.setUser(application.getUser());
        score.setSuccessProbability(probability);
        try {
            score.setScoreFactors(objectMapper.writeValueAsString(factors));
        } catch (JsonProcessingException e) {
            log.error("Error serializing factors to JSON", e);
            score.setScoreFactors("{}");
        }

        return scoreRepository.save(score);
    }
}
