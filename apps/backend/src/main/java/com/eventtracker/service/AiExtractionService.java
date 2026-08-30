package com.eventtracker.service;

import com.eventtracker.client.AiExtractionClient;
import com.eventtracker.dto.ApplicationDTO;
import com.eventtracker.dto.ExtractionRequest;
import com.eventtracker.dto.PlacementDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiExtractionService {

    private final AiExtractionClient aiExtractionClient;

    public PlacementDTO extractPlacementDetails(String emailContent) {
        log.info("Calling AI Extraction Service via OpenFeign for placement extraction");
        return aiExtractionClient.extractPlacement(new ExtractionRequest(emailContent));
    }

    public ApplicationDTO extractApplicationDetails(String emailContent) {
        log.info("Calling AI Extraction Service via OpenFeign for application extraction");
        return aiExtractionClient.extractApplication(new ExtractionRequest(emailContent));
    }
}
