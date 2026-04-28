package com.eventtracker.service;

import com.eventtracker.dto.RecommendationResponseDTO;
import com.eventtracker.entity.Application;
import com.eventtracker.entity.UserProfile;
import com.eventtracker.repository.ApplicationRepository;
import com.eventtracker.repository.UserProfileRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.langchain4j.model.chat.ChatLanguageModel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Lazy
@Slf4j
public class RecommendationService {

    private final ChatLanguageModel chatModel;
    private final UserProfileRepository profileRepository;
    private final ApplicationRepository applicationRepository;
    private final ObjectMapper objectMapper;

    public List<RecommendationResponseDTO> generatePersonalizedRecommendations(Long userId) {
        UserProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("User profile not found"));
        
        List<Application> applications = applicationRepository.findByUserId(userId);
        
        String prompt = buildPrompt(profile, applications);
        
        try {
            String aiResponse = chatModel.generate(prompt);
            return parseRecommendations(aiResponse);
        } catch (Exception e) {
            log.error("AI Recommendation generation failed", e);
            return getFallbackRecommendations(profile, applications);
        }
    }

    private String buildPrompt(UserProfile profile, List<Application> applications) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are an expert career and event advisor. Based on the following user profile and event application history, ");
        sb.append("provide 5 personalized event recommendations (Hackathons, Workshops, or Conferences) that would be a great fit for the user.\n\n");
        
        sb.append("USER PROFILE:\n");
        sb.append("- Experience Level: ").append(profile.getExperienceLevel()).append("\n");
        sb.append("- Skills: ").append(profile.getSkillsJson()).append("\n");
        sb.append("- Interests: ").append(profile.getInterests()).append("\n");
        sb.append("- Location: ").append(profile.getLocation()).append("\n\n");
        
        sb.append("APPLICATION HISTORY:\n");
        for (Application app : applications) {
            sb.append("- ").append(app.getEventName()).append(" (").append(app.getEventType()).append("): ").append(app.getStatus()).append("\n");
        }
        
        sb.append("\nINSTRUCTIONS:\n");
        sb.append("1. Recommend 5 specific real-world or common types of events.\n");
        sb.append("2. For each recommendation, provide: eventName, eventType, matchScore (0-100), reasons (list), skillGaps (list), bestTimeToApply, and tips (list).\n");
        sb.append("3. Return ONLY a valid JSON array of objects fitting this structure.\n");
        
        return sb.toString();
    }

    private List<RecommendationResponseDTO> parseRecommendations(String aiResponse) {
        try {
            // AI might wrap JSON in code blocks
            String json = aiResponse;
            if (json.contains("```json")) {
                json = json.substring(json.indexOf("```json") + 7, json.lastIndexOf("```"));
            } else if (json.contains("```")) {
                json = json.substring(json.indexOf("```") + 3, json.lastIndexOf("```"));
            }
            
            return objectMapper.readValue(json.trim(), new TypeReference<List<RecommendationResponseDTO>>() {});
        } catch (Exception e) {
            log.error("Failed to parse AI response: {}", aiResponse, e);
            throw new RuntimeException("Failed to generate recommendations");
        }
    }

    private List<RecommendationResponseDTO> getFallbackRecommendations(UserProfile profile, List<Application> applications) {
        // Simple procedural logic as fallback
        List<RecommendationResponseDTO> recs = new ArrayList<>();
        recs.add(RecommendationResponseDTO.builder()
                .eventName("MLH Prime Hackathon")
                .eventType("Hackathon")
                .matchScore(85.0)
                .reasons(List.of("Matches your interest in hackathons", "Great for building a portfolio"))
                .skillGaps(List.of("None identified"))
                .bestTimeToApply("4 weeks before")
                .tips(List.of("Team up with others", "Prepare a project idea in advance"))
                .build());
        return recs;
    }
}
