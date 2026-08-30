package com.eventtracker.client;

import com.eventtracker.dto.ApplicationDTO;
import com.eventtracker.dto.ExtractionRequest;
import com.eventtracker.dto.PlacementDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(
        name = "ai-extraction-service",
        url = "${AI_EXTRACTION_SERVICE_URL:http://localhost:8082}"
)
public interface AiExtractionClient {

    @PostMapping("/api/extraction/placement")
    PlacementDTO extractPlacement(@RequestBody ExtractionRequest request);

    @PostMapping("/api/extraction/application")
    ApplicationDTO extractApplication(@RequestBody ExtractionRequest request);
}
