package com.eventtracker.service;

import com.eventtracker.client.AiExtractionClient;
import com.eventtracker.dto.ApplicationDTO;
import com.eventtracker.dto.ExtractionRequest;
import com.eventtracker.dto.PlacementDTO;
import com.eventtracker.exception.AiServiceException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiExtractionService {

    private final AiExtractionClient aiExtractionClient;

    public PlacementDTO extractPlacementDetails(String emailContent) {
        log.info("Delegating placement extraction to AI service via OpenFeign");
        try {
            ExtractionRequest request = new ExtractionRequest(emailContent);
            return aiExtractionClient.extractPlacement(request);
        } catch (AiServiceException e) {
            log.error("AI service error during placement extraction (status: {}): {}", e.getStatusCode(), e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected failure calling AI placement extraction service via Feign", e);
            throw new AiServiceException("Failed to communicate with AI Extraction Service: " + e.getMessage(), 503, e);
        }
    }

    public ApplicationDTO extractApplicationDetails(String emailContent) {
        log.info("Delegating application extraction to AI service via OpenFeign");
        try {
            ExtractionRequest request = new ExtractionRequest(emailContent);
            return aiExtractionClient.extractApplication(request);
        } catch (AiServiceException e) {
            log.error("AI service error during application extraction (status: {}): {}", e.getStatusCode(), e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected failure calling AI application extraction service via Feign", e);
            throw new AiServiceException("Failed to communicate with AI Extraction Service: " + e.getMessage(), 503, e);
        }
    }

    public String classifyEmail(String emailContent) {
        log.info("Delegating email classification to AI service via OpenFeign");
        try {
            ExtractionRequest request = new ExtractionRequest(emailContent);
            Map<String, String> response = aiExtractionClient.classify(request);
            if (response != null && response.containsKey("classification")) {
                return response.get("classification");
            }
        } catch (Exception e) {
            log.error("Failed to classify email content via AI Extraction Service", e);
        }
        return "IRRELEVANT";
    }
}
