package com.careeros.ai.controller;

import com.careeros.ai.dto.ApplicationDTO;
import com.careeros.ai.dto.ExtractionRequest;
import com.careeros.ai.dto.PlacementDTO;
import com.careeros.ai.service.GeminiExtractionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/extraction")
@RequiredArgsConstructor
public class ExtractionController {

    private final GeminiExtractionService geminiExtractionService;

    @PostMapping("/classify")
    public ResponseEntity<Map<String, String>> classify(@Valid @RequestBody ExtractionRequest request) {
        log.info("Request to classify email content");
        String classification = geminiExtractionService.classifyEmail(request.getEmailContent());
        return ResponseEntity.ok(Map.of("classification", classification));
    }

    @PostMapping("/placement")
    public ResponseEntity<?> extractPlacement(@Valid @RequestBody ExtractionRequest request) {
        log.info("Request to extract placement details");
        try {
            PlacementDTO dto = geminiExtractionService.extractPlacementDetails(request.getEmailContent());
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            log.error("Placement extraction failed", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/application")
    public ResponseEntity<?> extractApplication(@Valid @RequestBody ExtractionRequest request) {
        log.info("Request to extract application details");
        try {
            ApplicationDTO dto = geminiExtractionService.extractApplicationDetails(request.getEmailContent());
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            log.error("Application extraction failed", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
