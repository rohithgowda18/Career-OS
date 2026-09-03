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
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Slf4j
@Component
public class CodeforcesClient implements CodingPlatformClient {

    private final String baseUrl;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public CodeforcesClient(
            @Value("${app.coding.codeforces.base-url:https://codeforces.com/api}") String baseUrl,
            ObjectMapper objectMapper) {
        this.baseUrl = baseUrl;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    @Override
    public Platform getPlatform() {
        return Platform.CODEFORCES;
    }

    @Override
    public Optional<PlatformProfileData> getProfile(String username) {
        if (username == null || username.isBlank()) {
            return Optional.empty();
        }

        try {
            String url = baseUrl + "/user.info?handles=" + username.trim();
            JsonNode result = executeGet(url);
            if (result == null || !result.isArray() || result.isEmpty()) {
                return Optional.empty();
            }

            JsonNode user = result.get(0);
            String handle = user.path("handle").asText(username);
            String firstName = user.path("firstName").asText("");
            String lastName = user.path("lastName").asText("");
            String org = user.path("organization").asText("");
            String avatar = user.path("titlePhoto").asText(null);

            // Combine firstName, lastName, organization as public bio/identifiers for verification
            String bio = (firstName + " " + lastName + " " + org).trim();

            PlatformProfileData profile = PlatformProfileData.builder()
                    .username(handle)
                    .realName((firstName + " " + lastName).trim())
                    .aboutMe(bio)
                    .avatarUrl(avatar)
                    .exists(true)
                    .build();

            return Optional.of(profile);
        } catch (Exception e) {
            log.error("Failed to fetch Codeforces profile for '{}': {}", username, e.getMessage());
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
            // 1. Fetch user rating from user.info
            String infoUrl = baseUrl + "/user.info?handles=" + username.trim();
            JsonNode infoResult = executeGet(infoUrl);
            Double rating = null;
            if (infoResult != null && infoResult.isArray() && !infoResult.isEmpty()) {
                JsonNode user = infoResult.get(0);
                if (user.has("rating") && !user.path("rating").isNull()) {
                    rating = user.path("rating").asDouble();
                }
            }

            // 2. Fetch submissions to count distinct solved problems
            String statusUrl = baseUrl + "/user.status?handle=" + username.trim() + "&from=1&count=10000";
            JsonNode submissions = executeGet(statusUrl);

            int totalSolved = 0;
            int easySolved = 0;
            int mediumSolved = 0;
            int hardSolved = 0;

            if (submissions != null && submissions.isArray()) {
                Set<String> solvedProblems = new HashSet<>();
                for (JsonNode sub : submissions) {
                    if ("OK".equalsIgnoreCase(sub.path("verdict").asText())) {
                        JsonNode prob = sub.path("problem");
                        String probId = prob.path("contestId").asText() + prob.path("index").asText();
                        if (solvedProblems.add(probId)) {
                            totalSolved++;
                            int probRating = prob.path("rating").asInt(0);
                            if (probRating > 0 && probRating < 1200) {
                                easySolved++;
                            } else if (probRating >= 1200 && probRating < 1800) {
                                mediumSolved++;
                            } else if (probRating >= 1800) {
                                hardSolved++;
                            }
                        }
                    }
                }
            }

            PlatformStatsData stats = PlatformStatsData.builder()
                    .username(username.trim())
                    .totalSolved(totalSolved)
                    .easySolved(easySolved)
                    .mediumSolved(mediumSolved)
                    .hardSolved(hardSolved)
                    .rating(rating)
                    .build();

            return Optional.of(stats);
        } catch (Exception e) {
            log.error("Failed to fetch Codeforces stats for '{}': {}", username, e.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public Optional<DailyChallengeDTO> getDailyChallenge() {
        DailyChallengeDTO challenge = DailyChallengeDTO.builder()
                .platform(Platform.CODEFORCES)
                .platformName("Codeforces")
                .title("Codeforces Practice Problemset")
                .difficulty("Competitive")
                .problemUrl("https://codeforces.com/problemset")
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
            log.warn("Codeforces API returned HTTP {}: {}", response.statusCode(), response.body());
            return null;
        }

        JsonNode root = objectMapper.readTree(response.body());
        if (!"OK".equalsIgnoreCase(root.path("status").asText())) {
            log.warn("Codeforces API returned error status: {}", root.path("comment").asText());
            return null;
        }

        return root.path("result");
    }
}
