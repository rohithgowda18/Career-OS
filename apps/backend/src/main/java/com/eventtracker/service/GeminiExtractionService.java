package com.eventtracker.service;

import com.eventtracker.dto.PlacementDTO;
import com.eventtracker.dto.ApplicationDTO;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.lang.reflect.Field;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@Slf4j
@Service
public class GeminiExtractionService {

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.api.model:gemini-2.5-flash}")
    private String geminiApiModel;

    private final ObjectMapper objectMapper;

    public GeminiExtractionService(ObjectMapper objectMapper) {
        // Create a copy and configure it to be lenient for safety
        this.objectMapper = objectMapper.copy()
                .registerModule(new JavaTimeModule())
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    @jakarta.annotation.PostConstruct
    public void init() {
        log.info("Using Gemini model: {}", getModel());
    }

    public PlacementDTO extractPlacementDetails(String emailContent) {
        String apiKey = getApiKey();
        if (apiKey == null || apiKey.trim().isEmpty()) {
            log.error("Gemini API key is not configured");
            throw new IllegalStateException("Gemini API key is not configured. Please set the GEMINI_API_KEY environment variable.");
        }

        if (emailContent == null || emailContent.trim().isEmpty()) {
            throw new IllegalArgumentException("Email content cannot be empty.");
        }

        // Dynamically inspect PlacementDTO fields using reflection
        StringBuilder schemaDesc = new StringBuilder();
        for (Field field : PlacementDTO.class.getDeclaredFields()) {
            String name = field.getName();
            // Skip system/metadata fields that Gemini shouldn't try to populate
            if (name.equals("id") || name.equals("userId") || name.equals("createdAt") || name.equals("updatedAt")) {
                continue;
            }
            schemaDesc.append("- ").append(name).append(" (type: ").append(field.getType().getSimpleName()).append(")\n");
        }

        String prompt = "You are an information extraction system.\n"
                + "Extract placement information from the recruitment email.\n"
                + "Return ONLY valid JSON.\n\n"
                + "Rules:\n"
                + "* Use null for missing values.\n"
                + "* Dates (assessmentDate, interviewDate) must be formatted as ISO-8601 (YYYY-MM-DDTHH:MM:SS) if found, or null if not found.\n"
                + "* Do not return markdown.\n"
                + "* Do not return explanations.\n"
                + "* Do not return code blocks.\n"
                + "* Return a JSON object matching the provided schema exactly.\n\n"
                + "IMPORTANT:\n"
                + "For URLs, email addresses, phone numbers, IDs, and unique identifiers:\n"
                + "* Copy values exactly from the source text.\n"
                + "* Preserve uppercase and lowercase characters.\n"
                + "* Do not normalize or rewrite values.\n"
                + "* Return the exact original value.\n\n"
                + "Expected Fields:\n"
                + schemaDesc.toString()
                + "\nEmail Content:\n"
                + emailContent;

        // Implement retry logic for transient failures (3 attempts)
        int maxAttempts = 3;
        Exception lastException = null;

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                log.info("Attempting Gemini extraction (Attempt {}/{})", attempt, maxAttempts);
                
                HttpClient client = HttpClient.newBuilder()
                        .connectTimeout(Duration.ofSeconds(15))
                        .build();

                // Prepare request body safely using Map to JSON
                Map<String, Object> textPart = Map.of("text", prompt);
                Map<String, Object> parts = Map.of("parts", List.of(textPart));
                Map<String, Object> contents = Map.of("contents", List.of(parts));
                Map<String, Object> generationConfig = Map.of("responseMimeType", "application/json");

                Map<String, Object> requestBodyMap = new HashMap<>();
                requestBodyMap.put("contents", List.of(parts));
                requestBodyMap.put("generationConfig", generationConfig);

                String requestBody = objectMapper.writeValueAsString(requestBodyMap);
                String modelName = getModel();
                String url = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + apiKey;

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .timeout(Duration.ofSeconds(30))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                        .build();

                HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() != 200) {
                    if (response.statusCode() == 404) {
                        log.error("Gemini API call failed with 404 for model '{}'. Original response: {}", modelName, response.body());
                        throw new IllegalArgumentException("The configured Gemini AI model '" + modelName + "' is unavailable or not supported.");
                    }
                    throw new RuntimeException("Gemini API returned status code " + response.statusCode() + ": " + response.body());
                }

                // Parse and validate response
                Map<String, Object> responseMap = objectMapper.readValue(response.body(), Map.class);
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseMap.get("candidates");
                if (candidates == null || candidates.isEmpty()) {
                    throw new RuntimeException("No candidates returned from Gemini API");
                }

                Map<String, Object> contentMap = (Map<String, Object>) candidates.get(0).get("content");
                List<Map<String, Object>> resParts = (List<Map<String, Object>>) contentMap.get("parts");
                if (resParts == null || resParts.isEmpty()) {
                    throw new RuntimeException("No parts returned in candidate content");
                }

                String extractedJson = (String) resParts.get(0).get("text");
                if (extractedJson == null || extractedJson.trim().isEmpty()) {
                    throw new RuntimeException("Empty response text from Gemini candidate parts");
                }

                // Strip markdown format wrappers (e.g. ```json ... ```) if present
                extractedJson = extractedJson.trim();
                if (extractedJson.startsWith("```")) {
                    int firstLineEnd = extractedJson.indexOf('\n');
                    int lastBackticks = extractedJson.lastIndexOf("```");
                    if (firstLineEnd != -1 && lastBackticks != -1 && lastBackticks > firstLineEnd) {
                        extractedJson = extractedJson.substring(firstLineEnd + 1, lastBackticks).trim();
                    }
                }

                // Validate and deserialize to PlacementDTO
                PlacementDTO dto = objectMapper.readValue(extractedJson, PlacementDTO.class);

                // Post-process URL preservation
                List<String> originalUrls = extractUrlsFromText(emailContent);
                if (!originalUrls.isEmpty()) {
                    String extractedLink = dto.getApplicationLink();
                    if (extractedLink != null && !extractedLink.trim().isEmpty()) {
                        String matchedUrl = null;
                        for (String origUrl : originalUrls) {
                            if (origUrl.equalsIgnoreCase(extractedLink)) {
                                matchedUrl = origUrl;
                                break;
                            }
                        }
                        if (matchedUrl != null) {
                            dto.setApplicationLink(matchedUrl);
                        } else if (originalUrls.size() == 1) {
                            dto.setApplicationLink(originalUrls.get(0));
                        }
                    } else if (originalUrls.size() == 1) {
                        dto.setApplicationLink(originalUrls.get(0));
                    }
                }

                return dto;

            } catch (IllegalArgumentException iae) {
                // Do not retry 404 / configuration errors, fail immediately
                log.error("Permanent error during AI extraction: {}", iae.getMessage());
                throw iae;
            } catch (Exception e) {
                log.warn("Gemini extraction attempt {} failed: {}", attempt, e.getMessage());
                lastException = e;
                if (attempt < maxAttempts) {
                    try {
                        Thread.sleep(1000 * attempt); // exponential-ish backoff
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("Extraction interrupted between retries", ie);
                    }
                }
            }
        }

        throw new RuntimeException("All extraction attempts failed. Last error: " + (lastException != null ? lastException.getMessage() : "unknown"), lastException);
    }

    private static final java.util.regex.Pattern URL_PATTERN = java.util.regex.Pattern.compile(
        "https?:\\/\\/[^\\s\\\"\\'\\<\\>]+"
    );

    private List<String> extractUrlsFromText(String text) {
        List<String> urls = new ArrayList<>();
        if (text == null) return urls;
        java.util.regex.Matcher matcher = URL_PATTERN.matcher(text);
        while (matcher.find()) {
            urls.add(matcher.group());
        }
        return urls;
    }

    private String getApiKey() {
        if (geminiApiKey != null && !geminiApiKey.trim().isEmpty()) {
            return geminiApiKey;
        }
        return System.getenv("GEMINI_API_KEY");
    }

    private String getModel() {
        if (geminiApiModel != null && !geminiApiModel.trim().isEmpty()) {
            return geminiApiModel;
        }
        String envModel = System.getenv("GEMINI_API_MODEL");
        return (envModel != null && !envModel.trim().isEmpty()) ? envModel : "gemini-2.5-flash";
    }

    public String classifyEmail(String emailContent) {
        String apiKey = getApiKey();
        if (apiKey == null || apiKey.trim().isEmpty()) {
            log.error("Gemini API key is not configured");
            return "IRRELEVANT";
        }

        if (emailContent == null || emailContent.trim().isEmpty()) {
            return "IRRELEVANT";
        }

        String prompt = "Classify the following email. Is it related to a specific job/internship application (including assessment tests, interviews, offers, rejections) or a specific hackathon/workshop/conference registration?\n\n"
                + "Return ONLY a single word response in uppercase: 'PLACEMENT' (for job/internship/career roles), 'APPLICATION' (for hackathons, workshops, conferences, events), or 'IRRELEVANT' (for newsletters, spam, generic marketing, social notifications, or general emails).\n\n"
                + "Email Content:\n"
                + emailContent;

        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(15))
                    .build();

            Map<String, Object> textPart = Map.of("text", prompt);
            Map<String, Object> parts = Map.of("parts", List.of(textPart));

            Map<String, Object> requestBodyMap = Map.of("contents", List.of(parts));

            String requestBody = objectMapper.writeValueAsString(requestBodyMap);
            String modelName = getModel();
            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + apiKey;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                Map<String, Object> responseMap = objectMapper.readValue(response.body(), Map.class);
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseMap.get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    Map<String, Object> contentMap = (Map<String, Object>) candidates.get(0).get("content");
                    List<Map<String, Object>> resParts = (List<Map<String, Object>>) contentMap.get("parts");
                    if (resParts != null && !resParts.isEmpty()) {
                        String result = (String) resParts.get(0).get("text");
                        if (result != null) {
                            result = result.trim().toUpperCase().replaceAll("[^A-Z]", "");
                            if ("PLACEMENT".equals(result) || "APPLICATION".equals(result)) {
                                return result;
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error during email classification", e);
        }
        return "IRRELEVANT";
    }

    public ApplicationDTO extractApplicationDetails(String emailContent) {
        String apiKey = getApiKey();
        if (apiKey == null || apiKey.trim().isEmpty()) {
            log.error("Gemini API key is not configured");
            throw new IllegalStateException("Gemini API key is not configured.");
        }

        if (emailContent == null || emailContent.trim().isEmpty()) {
            throw new IllegalArgumentException("Email content cannot be empty.");
        }

        StringBuilder schemaDesc = new StringBuilder();
        for (Field field : ApplicationDTO.class.getDeclaredFields()) {
            String name = field.getName();
            if (name.equals("id") || name.equals("createdAt") || name.equals("updatedAt")) {
                continue;
            }
            schemaDesc.append("- ").append(name).append(" (type: ").append(field.getType().getSimpleName()).append(")\n");
        }

        String prompt = "You are an information extraction system.\n"
                + "Extract application information (hackathon, workshop, conference, or internship event details) from the registration/acceptance email.\n"
                + "Return ONLY valid JSON.\n\n"
                + "Rules:\n"
                + "* Use null for missing values.\n"
                + "* Dates (deadline) must be formatted as ISO-8601 (YYYY-MM-DDTHH:MM:SS) if found, or null if not found.\n"
                + "* For eventType, choose exactly one from: Hackathon, Workshop, Conference, Internship, Other.\n"
                + "* For status, choose exactly one from: Interested, Applied, UnderReview, Accepted, Rejected.\n"
                + "* Do not return markdown.\n"
                + "* Do not return explanations.\n"
                + "* Do not return code blocks.\n"
                + "* Return a JSON object matching the provided schema exactly.\n\n"
                + "IMPORTANT:\n"
                + "For URLs, email addresses, and names: Copy values exactly from the source text.\n\n"
                + "Expected Fields:\n"
                + schemaDesc.toString()
                + "\nEmail Content:\n"
                + emailContent;

        int maxAttempts = 3;
        Exception lastException = null;

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                HttpClient client = HttpClient.newBuilder()
                        .connectTimeout(Duration.ofSeconds(15))
                        .build();

                Map<String, Object> textPart = Map.of("text", prompt);
                Map<String, Object> parts = Map.of("parts", List.of(textPart));
                Map<String, Object> generationConfig = Map.of("responseMimeType", "application/json");

                Map<String, Object> requestBodyMap = new HashMap<>();
                requestBodyMap.put("contents", List.of(parts));
                requestBodyMap.put("generationConfig", generationConfig);

                String requestBody = objectMapper.writeValueAsString(requestBodyMap);
                String modelName = getModel();
                String url = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + apiKey;

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .timeout(Duration.ofSeconds(30))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                        .build();

                HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() != 200) {
                    throw new RuntimeException("Gemini API returned status code " + response.statusCode());
                }

                Map<String, Object> responseMap = objectMapper.readValue(response.body(), Map.class);
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseMap.get("candidates");
                Map<String, Object> contentMap = (Map<String, Object>) candidates.get(0).get("content");
                List<Map<String, Object>> resParts = (List<Map<String, Object>>) contentMap.get("parts");
                String extractedJson = (String) resParts.get(0).get("text");

                extractedJson = extractedJson.trim();
                if (extractedJson.startsWith("```")) {
                    int firstLineEnd = extractedJson.indexOf('\n');
                    int lastBackticks = extractedJson.lastIndexOf("```");
                    if (firstLineEnd != -1 && lastBackticks != -1 && lastBackticks > firstLineEnd) {
                        extractedJson = extractedJson.substring(firstLineEnd + 1, lastBackticks).trim();
                    }
                }

                ApplicationDTO dto = objectMapper.readValue(extractedJson, ApplicationDTO.class);
                return dto;

            } catch (Exception e) {
                log.warn("Gemini application extraction attempt {} failed: {}", attempt, e.getMessage());
                lastException = e;
                if (attempt < maxAttempts) {
                    try {
                        Thread.sleep(1000 * attempt);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException(ie);
                    }
                }
            }
        }
        throw new RuntimeException("All extraction attempts failed.", lastException);
    }
}
