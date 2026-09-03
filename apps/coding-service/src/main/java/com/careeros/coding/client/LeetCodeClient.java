package com.careeros.coding.client;

import com.careeros.coding.client.dto.PlatformProfileData;
import com.careeros.coding.client.dto.PlatformStatsData;
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
import java.util.Collections;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
public class LeetCodeClient implements CodingPlatformClient {

    private final String graphqlUrl;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public LeetCodeClient(
            @Value("${app.coding.leetcode.graphql-url:https://leetcode.com/graphql}") String graphqlUrl,
            ObjectMapper objectMapper) {
        this.graphqlUrl = graphqlUrl;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    @Override
    public Platform getPlatform() {
        return Platform.LEETCODE;
    }

    @Override
    public Optional<PlatformProfileData> getProfile(String username) {
        if (username == null || username.isBlank()) {
            return Optional.empty();
        }

        try {
            String query = """
                query getUserProfile($username: String!) {
                  matchedUser(username: $username) {
                    username
                    profile {
                      aboutMe
                      realName
                      userAvatar
                    }
                  }
                }
                """;

            JsonNode data = executeGraphQL(query, Map.of("username", username.trim()));
            if (data == null || data.path("matchedUser").isNull()) {
                return Optional.empty();
            }

            JsonNode matchedUser = data.path("matchedUser");
            JsonNode profile = matchedUser.path("profile");

            PlatformProfileData profileData = PlatformProfileData.builder()
                    .username(matchedUser.path("username").asText(username))
                    .realName(profile.path("realName").asText(null))
                    .aboutMe(profile.path("aboutMe").asText(""))
                    .avatarUrl(profile.path("userAvatar").asText(null))
                    .exists(true)
                    .build();

            return Optional.of(profileData);
        } catch (Exception e) {
            log.error("Failed to fetch LeetCode profile for '{}': {}", username, e.getMessage());
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
            String query = """
                query getUserStats($username: String!) {
                  matchedUser(username: $username) {
                    username
                    submitStatsGlobal {
                      acSubmissionNum {
                        difficulty
                        count
                      }
                    }
                  }
                  userContestRanking(username: $username) {
                    rating
                  }
                }
                """;

            JsonNode data = executeGraphQL(query, Map.of("username", username.trim()));
            if (data == null || data.path("matchedUser").isNull()) {
                return Optional.empty();
            }

            JsonNode matchedUser = data.path("matchedUser");
            JsonNode acArray = matchedUser.path("submitStatsGlobal").path("acSubmissionNum");

            int totalSolved = 0;
            int easySolved = 0;
            int mediumSolved = 0;
            int hardSolved = 0;

            if (acArray.isArray()) {
                for (JsonNode item : acArray) {
                    String diff = item.path("difficulty").asText("");
                    int count = item.path("count").asInt(0);

                    if ("All".equalsIgnoreCase(diff)) {
                        totalSolved = count;
                    } else if ("Easy".equalsIgnoreCase(diff)) {
                        easySolved = count;
                    } else if ("Medium".equalsIgnoreCase(diff)) {
                        mediumSolved = count;
                    } else if ("Hard".equalsIgnoreCase(diff)) {
                        hardSolved = count;
                    }
                }
            }

            Double rating = null;
            JsonNode contest = data.path("userContestRanking");
            if (!contest.isNull() && contest.has("rating") && !contest.path("rating").isNull()) {
                rating = contest.path("rating").asDouble();
            }

            PlatformStatsData statsData = PlatformStatsData.builder()
                    .username(matchedUser.path("username").asText(username))
                    .totalSolved(totalSolved)
                    .easySolved(easySolved)
                    .mediumSolved(mediumSolved)
                    .hardSolved(hardSolved)
                    .rating(rating)
                    .build();

            return Optional.of(statsData);
        } catch (Exception e) {
            log.error("Failed to fetch LeetCode statistics for '{}': {}", username, e.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public Optional<com.careeros.coding.dto.DailyChallengeDTO> getDailyChallenge() {
        try {
            String query = """
                query questionOfToday {
                  activeDailyCodingChallengeQuestion {
                    date
                    link
                    question {
                      title
                      titleSlug
                      difficulty
                    }
                  }
                }
                """;

            JsonNode data = executeGraphQL(query, Map.of());
            if (data == null || data.path("activeDailyCodingChallengeQuestion").isNull()) {
                return Optional.empty();
            }

            JsonNode challenge = data.path("activeDailyCodingChallengeQuestion");
            JsonNode question = challenge.path("question");
            String link = challenge.path("link").asText("");
            String problemUrl = link.startsWith("http") ? link : "https://leetcode.com" + link;

            com.careeros.coding.dto.DailyChallengeDTO dto = com.careeros.coding.dto.DailyChallengeDTO.builder()
                    .platform(Platform.LEETCODE)
                    .platformName("LeetCode")
                    .title(question.path("title").asText("Daily Coding Challenge"))
                    .difficulty(question.path("difficulty").asText("Medium"))
                    .problemUrl(problemUrl)
                    .date(java.time.LocalDate.now())
                    .available(true)
                    .build();

            return Optional.of(dto);
        } catch (Exception e) {
            log.error("Failed to fetch LeetCode daily challenge: {}", e.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public Map<java.time.LocalDate, Integer> getDailyActivity(String username, int year) {
        if (username == null || username.isBlank()) {
            return Collections.emptyMap();
        }

        try {
            String query = """
                query userProfileCalendar($username: String!, $year: Int) {
                  matchedUser(username: $username) {
                    userCalendar(year: $year) {
                      submissionCalendar
                    }
                  }
                }
                """;

            JsonNode data = executeGraphQL(query, Map.of("username", username.trim(), "year", year));
            if (data == null || data.path("matchedUser").isNull()) {
                return Collections.emptyMap();
            }

            JsonNode calendar = data.path("matchedUser").path("userCalendar");
            String subCalJson = calendar.path("submissionCalendar").asText("");
            if (subCalJson.isBlank()) {
                return Collections.emptyMap();
            }

            JsonNode subCalMap = objectMapper.readTree(subCalJson);
            Map<java.time.LocalDate, Integer> result = new java.util.HashMap<>();

            subCalMap.fields().forEachRemaining(entry -> {
                try {
                    long epoch = Long.parseLong(entry.getKey());
                    int count = entry.getValue().asInt(0);
                    java.time.LocalDate date = java.time.Instant.ofEpochSecond(epoch)
                            .atZone(java.time.ZoneId.of("UTC"))
                            .toLocalDate();
                    if (date.getYear() == year || year == 0) {
                        result.put(date, count);
                    }
                } catch (Exception ignored) {}
            });

            return result;
        } catch (Exception e) {
            log.error("Failed to fetch LeetCode calendar activity for '{}': {}", username, e.getMessage());
            return Collections.emptyMap();
        }
    }

    private JsonNode executeGraphQL(String query, Map<String, Object> variables) throws Exception {
        Map<String, Object> bodyMap = Map.of(
                "query", query,
                "variables", variables
        );
        String requestBody = objectMapper.writeValueAsString(bodyMap);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(graphqlUrl))
                .timeout(Duration.ofSeconds(10))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Career-OS/1.0")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.warn("LeetCode GraphQL returned HTTP {}: {}", response.statusCode(), response.body());
            return null;
        }

        JsonNode root = objectMapper.readTree(response.body());
        if (root.has("errors") && !root.path("errors").isEmpty()) {
            log.warn("LeetCode GraphQL returned query errors: {}", root.path("errors"));
        }

        return root.path("data");
    }
}
