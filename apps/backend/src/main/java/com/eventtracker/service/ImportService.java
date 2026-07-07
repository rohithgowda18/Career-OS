package com.eventtracker.service;

import com.eventtracker.dto.ApplicationDTO;
import com.eventtracker.dto.ImportRequestDTO;
import com.eventtracker.dto.PlacementDTO;
import com.eventtracker.entity.Application;
import com.eventtracker.entity.Placement;
import com.eventtracker.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImportService {

    private final GeminiExtractionService geminiExtractionService;
    private final PlacementService placementService;
    private final ApplicationService applicationService;

    @Transactional
    public Map<String, Object> importContent(User user, ImportRequestDTO request) {
        log.info("Processing manual import request from source: '{}' for user: {}", request.getSource(), user.getId());

        String classification = geminiExtractionService.classifyEmail(request.getContent());
        log.info("Import content classified as: {}", classification);

        Map<String, Object> response = new HashMap<>();
        response.put("source", request.getSource());
        response.put("classification", classification);

        if ("PLACEMENT".equals(classification)) {
            PlacementDTO details = geminiExtractionService.extractPlacementDetails(request.getContent());
            if (details.getStatus() == null || details.getStatus().isBlank()) {
                details.setStatus("APPLIED");
            }
            Placement placement = placementService.createPlacement(user, details);
            
            response.put("type", "PLACEMENT");
            response.put("id", placement.getId());
            response.put("title", placement.getCompanyName() + " - " + placement.getRole());
            response.put("company", placement.getCompanyName());
            response.put("role", placement.getRole());
            return response;

        } else if ("APPLICATION".equals(classification)) {
            ApplicationDTO details = geminiExtractionService.extractApplicationDetails(request.getContent());
            if (details.getStatus() == null || details.getStatus().isBlank()) {
                details.setStatus("Applied");
            }
            Application application = applicationService.createApplication(user, details);

            response.put("type", "APPLICATION");
            response.put("id", application.getId());
            response.put("title", application.getEventName());
            response.put("eventType", application.getEventType());
            return response;
        }

        throw new IllegalArgumentException("The content provided could not be classified as a relevant career placement or event opportunity. Please verify the content and try again.");
    }
}
