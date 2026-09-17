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

@Slf4j
@RestController
@RequestMapping("/api/extraction")
@RequiredArgsConstructor
public class ExtractionController {

    private final GeminiExtractionService geminiExtractionService;

    @PostMapping("/placement")
    public ResponseEntity<PlacementDTO> extractPlacement(@Valid @RequestBody ExtractionRequest request) {
        log.info("Request to extract placement details");
        PlacementDTO dto = geminiExtractionService.extractPlacementDetails(request.getEmailContent());
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/application")
    public ResponseEntity<ApplicationDTO> extractApplication(@Valid @RequestBody ExtractionRequest request) {
        log.info("Request to extract application details");
        ApplicationDTO dto = geminiExtractionService.extractApplicationDetails(request.getEmailContent());
        return ResponseEntity.ok(dto);
    }
}
