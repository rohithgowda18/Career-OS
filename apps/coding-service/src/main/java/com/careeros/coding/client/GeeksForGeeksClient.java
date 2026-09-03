package com.careeros.coding.client;

import com.careeros.coding.client.dto.PlatformProfileData;
import com.careeros.coding.client.dto.PlatformStatsData;
import com.careeros.coding.dto.DailyChallengeDTO;
import com.careeros.coding.model.Platform;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.util.Optional;

@Slf4j
@Component
public class GeeksForGeeksClient implements CodingPlatformClient {

    private final String baseUrl;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public GeeksForGeeksClient(
            @Value("${app.coding.geeksforgeeks.base-url:https://practiceapi.geeksforgeeks.org/api/v1}") String baseUrl,
            ObjectMapper objectMapper) {
        this.baseUrl = baseUrl;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    @Override
    public Platform getPlatform() {
        return Platform.GEEKSFORGEEKS;
    }

    @Override
    public Optional<PlatformProfileData> getProfile(String username) {
        if (username == null || username.isBlank()) {
            return Optional.empty();
        }

        try {
            String url = baseUrl + "/users/" + username.trim() + "/";
            JsonNode data = executeGet(url);
            if (data == null || !data.has("result")) {
                return Optional.empty();
            }

            JsonNode result = data.path("result");
            String handle = result.path("handle").asText(username);
            String name = result.path("name").asText("");
            String institute = result.path("institute").asText("");
            String avatar = result.path("profile_image_url").asText(null);

            PlatformProfileData profile = PlatformProfileData.builder()
                    .username(handle)
                    .realName(name)
                    .aboutMe((name + " " + institute).trim())
                    .avatarUrl(avatar)
                    .exists(true)
                    .build();

            return Optional.of(profile);
        } catch (Exception e) {
            log.error("Failed to fetch GeeksforGeeks profile for '{}': {}", username, e.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public boolean verifyOwnership(String username, String verificationCode) {
        if (username == null || verificationCode == null || verificationCode.isBlank()) {
            return false;
        }

        Optional<PlatformProfileData> profileOpt = getProfile(username);
        if (profileOpt.isEmpty()) {
            return false;
        }

        String aboutMe = profileOpt.get().getAboutMe();
        return aboutMe != null && aboutMe.contains(verificationCode.trim());
    }

    @Override
    public Optional<PlatformStatsData> getStats(String username) {
        if (username == null || username.isBlank()) {
            return Optional.empty();
        }

        try {
            String url = baseUrl + "/users/" + username.trim() + "/";
            JsonNode data = executeGet(url);
            if (data == null || !data.has("result")) {
                return Optional.empty();
            }

            JsonNode result = data.path("result");
            int totalSolved = result.path("total_problems_solved").asInt(0);
            Double score = null;
            if (result.has("score") && !result.path("score").isNull()) {
                score = result.path("score").asDouble();
            }

            int easySolved = 0;
            int mediumSolved = 0;
            int hardSolved = 0;

            // Extract difficulty breakdown if available in response
            JsonNode countByDiff = result.path("problems_solved_count_by_difficulty");
            if (!countByDiff.isNull() && countByDiff.isObject()) {
                easySolved = countByDiff.path("easy").asInt(0) + countByDiff.path("school").asInt(0) + countByDiff.path("basic").asInt(0);
                mediumSolved = countByDiff.path("medium").asInt(0);
                hardSolved = countByDiff.path("hard").asInt(0);
            }

            PlatformStatsData stats = PlatformStatsData.builder()
                    .username(username.trim())
                    .totalSolved(totalSolved)
                    .easySolved(easySolved)
                    .mediumSolved(mediumSolved)
                    .hardSolved(hardSolved)
                    .rating(score)
                    .build();

            return Optional.of(stats);
        } catch (Exception e) {
            log.error("Failed to fetch GeeksforGeeks stats for '{}': {}", username, e.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public Optional<DailyChallengeDTO> getDailyChallenge() {
        DailyChallengeDTO challenge = DailyChallengeDTO.builder()
                .platform(Platform.GEEKSFORGEEKS)
                .platformName("GeeksforGeeks")
                .title("GFG Problem of the Day")
                .difficulty("POTD")
                .problemUrl("https://practice.geeksforgeeks.org/problem-of-the-day")
                .date(LocalDate.now())
                .available(true)
                .build();
        return Optional.of(challenge);
    }

    private JsonNode executeGet(String url) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(10))
                .header("Accept", "application/json")
                .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Career-OS/1.0")
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            log.warn("GeeksforGeeks API returned HTTP {}: {}", response.statusCode(), response.body());
            return null;
        }

        return objectMapper.readTree(response.body());
    }
}
