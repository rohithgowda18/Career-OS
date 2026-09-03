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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
public class CodeChefClient implements CodingPlatformClient {

    private final String baseUrl;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    private static final Pattern RATING_PATTERN = Pattern.compile("class=\"rating-number\">([0-9]+)<");
    private static final Pattern SOLVED_PATTERN = Pattern.compile("Total Problems Solved:\\s*([0-9]+)");

    public CodeChefClient(
            @Value("${app.coding.codechef.base-url:https://www.codechef.com}") String baseUrl,
            ObjectMapper objectMapper) {
        this.baseUrl = baseUrl;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }

    @Override
    public Platform getPlatform() {
        return Platform.CODECHEF;
    }

    @Override
    public Optional<PlatformProfileData> getProfile(String username) {
        if (username == null || username.isBlank()) {
            return Optional.empty();
        }

        try {
            String url = baseUrl + "/users/" + username.trim();
            String html = fetchHtml(url);
            if (html == null || html.contains("Could not find user") || html.contains("404")) {
                return Optional.empty();
            }

            PlatformProfileData profile = PlatformProfileData.builder()
                    .username(username.trim())
                    .aboutMe(html) // Searchable for bio verification
                    .exists(true)
                    .build();

            return Optional.of(profile);
        } catch (Exception e) {
            log.error("Failed to fetch CodeChef profile for '{}': {}", username, e.getMessage());
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

        String html = profileOpt.get().getAboutMe();
        return html != null && html.contains(verificationCode.trim());
    }

    @Override
    public Optional<PlatformStatsData> getStats(String username) {
        if (username == null || username.isBlank()) {
            return Optional.empty();
        }

        try {
            String url = baseUrl + "/users/" + username.trim();
            String html = fetchHtml(url);
            if (html == null) {
                return Optional.empty();
            }

            int totalSolved = 0;
            Double rating = null;

            Matcher solvedMatcher = SOLVED_PATTERN.matcher(html);
            if (solvedMatcher.find()) {
                totalSolved = Integer.parseInt(solvedMatcher.group(1));
            }

            Matcher ratingMatcher = RATING_PATTERN.matcher(html);
            if (ratingMatcher.find()) {
                rating = Double.parseDouble(ratingMatcher.group(1));
            }

            PlatformStatsData stats = PlatformStatsData.builder()
                    .username(username.trim())
                    .totalSolved(totalSolved)
                    .easySolved(0)
                    .mediumSolved(0)
                    .hardSolved(0)
                    .rating(rating)
                    .build();

            return Optional.of(stats);
        } catch (Exception e) {
            log.error("Failed to fetch CodeChef stats for '{}': {}", username, e.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public Optional<DailyChallengeDTO> getDailyChallenge() {
        DailyChallengeDTO challenge = DailyChallengeDTO.builder()
                .platform(Platform.CODECHEF)
                .platformName("CodeChef")
                .title("CodeChef Daily Practice")
                .difficulty("Practice")
                .problemUrl("https://www.codechef.com/practice")
                .date(LocalDate.now())
                .available(true)
                .build();
        return Optional.of(challenge);
    }

    private String fetchHtml(String url) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(8))
                .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Career-OS/1.0")
                .header("Accept", "text/html,application/xhtml+xml,application/json")
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() == 200) {
            return response.body();
        }
        log.warn("CodeChef request to '{}' returned HTTP {}", url, response.statusCode());
        return null;
    }
}
