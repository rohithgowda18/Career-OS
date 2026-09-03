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
public class HackerRankClient implements CodingPlatformClient {

    private final String baseUrl;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public HackerRankClient(
            @Value("${app.coding.hackerrank.base-url:https://www.hackerrank.com/rest}") String baseUrl,
            ObjectMapper objectMapper) {
        this.baseUrl = baseUrl;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    @Override
    public Platform getPlatform() {
        return Platform.HACKERRANK;
    }

    @Override
    public Optional<PlatformProfileData> getProfile(String username) {
        if (username == null || username.isBlank()) {
            return Optional.empty();
        }

        try {
            String url = baseUrl + "/hackers/" + username.trim() + "/profile";
            JsonNode data = executeGet(url);
            if (data == null || !data.has("model")) {
                return Optional.empty();
            }

            JsonNode model = data.path("model");
            String handle = model.path("username").asText(username);
            String name = model.path("name").asText("");
            String shortBio = model.path("short_bio").asText("");
            String about = model.path("about").asText("");
            String avatar = model.path("avatar").asText(null);

            PlatformProfileData profile = PlatformProfileData.builder()
                    .username(handle)
                    .realName(name)
                    .aboutMe((shortBio + " " + about).trim())
                    .avatarUrl(avatar)
                    .exists(true)
                    .build();

            return Optional.of(profile);
        } catch (Exception e) {
            log.error("Failed to fetch HackerRank profile for '{}': {}", username, e.getMessage());
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
            // Fetch badges to calculate solved challenges
            String url = baseUrl + "/hackers/" + username.trim() + "/badges";
            JsonNode data = executeGet(url);

            int totalSolved = 0;
            if (data != null && data.has("models") && data.path("models").isArray()) {
                for (JsonNode badge : data.path("models")) {
                    int solved = badge.path("solved").asInt(0);
                    totalSolved += solved;
                }
            }

            PlatformStatsData stats = PlatformStatsData.builder()
                    .username(username.trim())
                    .totalSolved(totalSolved)
                    .easySolved(0)
                    .mediumSolved(0)
                    .hardSolved(0)
                    .rating(null)
                    .build();

            return Optional.of(stats);
        } catch (Exception e) {
            log.error("Failed to fetch HackerRank stats for '{}': {}", username, e.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public Optional<DailyChallengeDTO> getDailyChallenge() {
        DailyChallengeDTO challenge = DailyChallengeDTO.builder()
                .platform(Platform.HACKERRANK)
                .platformName("HackerRank")
                .title("HackerRank Problem Solving")
                .difficulty("Intermediate")
                .problemUrl("https://www.hackerrank.com/domains/algorithms")
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
            log.warn("HackerRank API returned HTTP {}: {}", response.statusCode(), response.body());
            return null;
        }

        return objectMapper.readTree(response.body());
    }
}
