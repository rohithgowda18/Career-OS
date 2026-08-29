package com.eventtracker.service;

import com.eventtracker.dto.PlacementDTO;
import com.eventtracker.dto.ApplicationDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

@Slf4j
@Service
public class GeminiExtractionService {

    private final String aiServiceUrl;
    private final ObjectMapper objectMapper;

    public GeminiExtractionService(
            @Value("${app.ai-extraction-service.url:http://localhost:8082}") String aiServiceUrl,
            ObjectMapper objectMapper) {
        this.aiServiceUrl = aiServiceUrl.replaceAll("/+$", ""); // strip trailing slash
        this.objectMapper = objectMapper;
    }

    public PlacementDTO extractPlacementDetails(String emailContent) {
        log.info("Delegating placement extraction to AI service at: {}", aiServiceUrl);
        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(15))
                    .build();

            String requestBody = objectMapper.writeValueAsString(Map.of("emailContent", emailContent));
            String url = aiServiceUrl + "/api/extraction/placement";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(60))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("AI service returned error status: {}. Body: {}", response.statusCode(), response.body());
                throw new RuntimeException("AI service failed extraction: " + response.body());
            }

            return objectMapper.readValue(response.body(), PlacementDTO.class);
        } catch (Exception e) {
            log.error("Failed to call placement extraction service", e);
            throw new RuntimeException("AI Placement Extraction Service failed: " + e.getMessage(), e);
        }
    }

    public ApplicationDTO extractApplicationDetails(String emailContent) {
        log.info("Delegating application extraction to AI service at: {}", aiServiceUrl);
        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(15))
                    .build();

            String requestBody = objectMapper.writeValueAsString(Map.of("emailContent", emailContent));
            String url = aiServiceUrl + "/api/extraction/application";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(60))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("AI service returned error status: {}. Body: {}", response.statusCode(), response.body());
                throw new RuntimeException("AI service failed extraction: " + response.body());
            }

            return objectMapper.readValue(response.body(), ApplicationDTO.class);
        } catch (Exception e) {
            log.error("Failed to call application extraction service", e);
            throw new RuntimeException("AI Application Extraction Service failed: " + e.getMessage(), e);
        }
    }

    public String classifyEmail(String emailContent) {
        log.info("Delegating email classification to AI service at: {}", aiServiceUrl);
        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(15))
                    .build();

            String requestBody = objectMapper.writeValueAsString(Map.of("emailContent", emailContent));
            String url = aiServiceUrl + "/api/extraction/classify";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(60))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                Map<String, String> responseMap = objectMapper.readValue(response.body(), Map.class);
                return responseMap.get("classification");
            } else {
                log.error("AI service classify returned error status: {}. Body: {}", response.statusCode(), response.body());
            }
        } catch (Exception e) {
            log.error("Failed to call classification service", e);
        }
        return "IRRELEVANT";
    }
}
