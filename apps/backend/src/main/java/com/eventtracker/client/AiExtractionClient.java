package com.eventtracker.client;

import com.eventtracker.dto.ApplicationDTO;
import com.eventtracker.dto.ExtractionRequest;
import com.eventtracker.dto.PlacementDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@FeignClient(
        name = "ai-extraction-service",
        url = "${AI_EXTRACTION_SERVICE_URL:${app.ai-extraction-service.url:http://localhost:8082}}",
        configuration = AiExtractionClientConfiguration.class
)
public interface AiExtractionClient {

    @PostMapping(value = "/api/extraction/classify", consumes = MediaType.APPLICATION_JSON_VALUE)
    Map<String, String> classify(@RequestBody ExtractionRequest request);

    @PostMapping(value = "/api/extraction/placement", consumes = MediaType.APPLICATION_JSON_VALUE)
    PlacementDTO extractPlacement(@RequestBody ExtractionRequest request);

    @PostMapping(value = "/api/extraction/application", consumes = MediaType.APPLICATION_JSON_VALUE)
    ApplicationDTO extractApplication(@RequestBody ExtractionRequest request);
}
