package com.eventtracker.service.job;

import com.eventtracker.dto.JobDTO;
import com.eventtracker.dto.JobSearchCriteria;
import com.eventtracker.dto.JobSearchResult;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Component
public class AdzunaJobProvider implements JobProvider {

    private final String appId;
    private final String appKey;
    private final String country;
    private final String baseUrl;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public AdzunaJobProvider(
            @Value("${app.jobs.adzuna.app-id:${ADZUNA_APP_ID:}}") String appId,
            @Value("${app.jobs.adzuna.app-key:${ADZUNA_APP_KEY:}}") String appKey,
            @Value("${app.jobs.adzuna.country:${ADZUNA_COUNTRY:in}}") String country,
            @Value("${app.jobs.adzuna.base-url:${ADZUNA_BASE_URL:https://api.adzuna.com/v1/api/jobs}}") String baseUrl,
            ObjectMapper objectMapper) {
        this.appId = appId != null ? appId.trim() : "";
        this.appKey = appKey != null ? appKey.trim() : "";
        this.country = (country != null && !country.isBlank()) ? country.trim().toLowerCase() : "in";
        this.baseUrl = baseUrl != null ? baseUrl.replaceAll("/+$", "") : "https://api.adzuna.com/v1/api/jobs";
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(6))
                .build();
    }

    @Override
    public boolean isConfigured() {
        return !appId.isBlank() && !appKey.isBlank();
    }

    @Override
    public String getProviderName() {
        return "Adzuna";
    }

    @Override
    public JobSearchResult searchJobs(JobSearchCriteria criteria) {
        if (!isConfigured()) {
            throw new IllegalStateException("Adzuna Job API is not configured. Missing ADZUNA_APP_ID or ADZUNA_APP_KEY.");
        }

        try {
            // Adzuna pages are 1-indexed
            int adzunaPage = Math.max(1, criteria.getPage() + 1);
            int pageSize = Math.min(50, Math.max(1, criteria.getSize()));

            StringBuilder urlBuilder = new StringBuilder();
            urlBuilder.append(baseUrl)
                    .append("/").append(URLEncoder.encode(country, StandardCharsets.UTF_8))
                    .append("/search/").append(adzunaPage)
                    .append("?app_id=").append(URLEncoder.encode(appId, StandardCharsets.UTF_8))
                    .append("&app_key=").append(URLEncoder.encode(appKey, StandardCharsets.UTF_8))
                    .append("&results_per_page=").append(pageSize);

            // Construct search terms (combining keyword, jobType, experience)
            StringBuilder queryBuilder = new StringBuilder();
            if (criteria.getKeyword() != null && !criteria.getKeyword().isBlank()) {
                queryBuilder.append(criteria.getKeyword().trim());
            }

            if (criteria.getExperienceLevel() != null && !criteria.getExperienceLevel().isBlank()) {
                String exp = criteria.getExperienceLevel().trim().toLowerCase();
                if (exp.contains("fresher") || exp.contains("entry")) {
                    if (queryBuilder.length() > 0) queryBuilder.append(" ");
                    queryBuilder.append("fresher");
                }
            }

            if (criteria.getWorkMode() != null && !criteria.getWorkMode().isBlank()) {
                String mode = criteria.getWorkMode().trim().toLowerCase();
                if (mode.equals("remote")) {
                    if (queryBuilder.length() > 0) queryBuilder.append(" ");
                    queryBuilder.append("remote");
                }
            }

            if (queryBuilder.length() > 0) {
                urlBuilder.append("&what=").append(URLEncoder.encode(queryBuilder.toString(), StandardCharsets.UTF_8));
            }

            if (criteria.getLocation() != null && !criteria.getLocation().isBlank()) {
                urlBuilder.append("&where=").append(URLEncoder.encode(criteria.getLocation().trim(), StandardCharsets.UTF_8));
            }

            if (criteria.getCompany() != null && !criteria.getCompany().isBlank()) {
                urlBuilder.append("&company=").append(URLEncoder.encode(criteria.getCompany().trim(), StandardCharsets.UTF_8));
            }

            if (criteria.getJobType() != null && !criteria.getJobType().isBlank()) {
                String type = criteria.getJobType().trim().toLowerCase();
                if (type.contains("full") || type.contains("permanent")) {
                    urlBuilder.append("&full_time=1");
                } else if (type.contains("contract") || type.contains("intern")) {
                    urlBuilder.append("&contract=1");
                }
            }

            if ("date".equalsIgnoreCase(criteria.getSortBy())) {
                urlBuilder.append("&sort_by=date");
            } else {
                urlBuilder.append("&sort_by=relevance");
            }

            String url = urlBuilder.toString();
            log.debug("Calling Adzuna Job API (page: {}, size: {})", adzunaPage, pageSize);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(10))
                    .header("Accept", "application/json")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Adzuna API returned status code {}: {}", response.statusCode(), response.body());
                throw new RuntimeException("External job provider returned HTTP " + response.statusCode());
            }

            JsonNode root = objectMapper.readTree(response.body());
            long totalCount = root.path("count").asLong(0);
            JsonNode resultsNode = root.path("results");

            List<JobDTO> jobs = new ArrayList<>();
            if (resultsNode.isArray()) {
                for (JsonNode item : resultsNode) {
                    jobs.add(mapAdzunaJob(item));
                }
            }

            int totalPages = (int) Math.ceil((double) totalCount / pageSize);

            return JobSearchResult.builder()
                    .content(jobs)
                    .totalElements(totalCount)
                    .totalPages(totalPages)
                    .currentPage(criteria.getPage())
                    .size(pageSize)
                    .source(getProviderName())
                    .build();

        } catch (Exception e) {
            log.error("Failed to query Adzuna Job API: {}", e.getMessage());
            throw new RuntimeException("Failed to query job provider: " + e.getMessage(), e);
        }
    }

    @Override
    public Optional<JobDTO> getJobById(String externalJobId) {
        // Adzuna search endpoint supports searching by exact keyword/ID if needed,
        // but since search result already contains full detail, this is called as a fallback.
        if (externalJobId == null || externalJobId.isBlank()) {
            return Optional.empty();
        }
        try {
            JobSearchResult result = searchJobs(JobSearchCriteria.builder()
                    .keyword(externalJobId)
                    .page(0)
                    .size(5)
                    .build());
            return result.getContent().stream()
                    .filter(j -> externalJobId.equalsIgnoreCase(j.getExternalJobId()))
                    .findFirst();
        } catch (Exception e) {
            log.warn("Could not retrieve specific job by ID from Adzuna: {}", e.getMessage());
            return Optional.empty();
        }
    }

    private JobDTO mapAdzunaJob(JsonNode node) {
        String id = node.path("id").asText("");
        String title = cleanHtml(node.path("title").asText(""));
        String description = cleanHtml(node.path("description").asText(""));
        String redirectUrl = node.path("redirect_url").asText("");

        String companyName = "Unknown Company";
        if (node.has("company") && node.path("company").has("display_name")) {
            companyName = node.path("company").path("display_name").asText("Unknown Company");
        }

        String locationName = "";
        if (node.has("location") && node.path("location").has("display_name")) {
            locationName = node.path("location").path("display_name").asText("");
        }

        String contractTime = node.path("contract_time").asText("");
        String contractType = node.path("contract_type").asText("");
        String jobType = determineJobType(title, contractTime, contractType);

        String workMode = determineWorkMode(title, locationName, description);
        String experience = determineExperience(title, description);

        String salary = "";
        if (node.has("salary_min") || node.has("salary_max")) {
            double min = node.path("salary_min").asDouble(0);
            double max = node.path("salary_max").asDouble(0);
            if (min > 0 && max > 0 && min != max) {
                salary = String.format("₹%,.0f - ₹%,.0f", min, max);
            } else if (max > 0) {
                salary = String.format("Up to ₹%,.0f", max);
            } else if (min > 0) {
                salary = String.format("From ₹%,.0f", min);
            }
        }

        String created = node.path("created").asText("");

        List<String> skills = extractSkills(title + " " + description);

        return JobDTO.builder()
                .externalJobId(id)
                .title(title)
                .company(companyName)
                .location(locationName)
                .jobType(jobType)
                .experienceLevel(experience)
                .workMode(workMode)
                .source(getProviderName())
                .applyUrl(redirectUrl)
                .description(description)
                .salary(salary)
                .postedAt(created)
                .skills(skills)
                .build();
    }

    private String cleanHtml(String text) {
        if (text == null) return "";
        return text.replaceAll("<[^>]*>", "").replaceAll("&amp;", "&").replaceAll("&nbsp;", " ").trim();
    }

    private String determineJobType(String title, String contractTime, String contractType) {
        String lower = (title + " " + contractTime + " " + contractType).toLowerCase();
        if (lower.contains("intern") || lower.contains("trainee") || lower.contains("apprentice")) {
            return "Internship";
        }
        if (lower.contains("contract") || lower.contains("temporary")) {
            return "Contract";
        }
        if (lower.contains("part_time") || lower.contains("part-time")) {
            return "Part-time";
        }
        return "Full-time";
    }

    private String determineWorkMode(String title, String location, String description) {
        String lower = (title + " " + location + " " + description).toLowerCase();
        if (lower.contains("remote") || lower.contains("work from home") || lower.contains("wfh")) {
            return "Remote";
        }
        if (lower.contains("hybrid")) {
            return "Hybrid";
        }
        return "On-site";
    }

    private String determineExperience(String title, String description) {
        String lower = (title + " " + description).toLowerCase();
        if (lower.contains("intern") || lower.contains("fresher") || lower.contains("graduate") || lower.contains("entry level") || lower.contains("entry-level")) {
            return "Fresher / Entry Level";
        }
        if (lower.contains("1-2 years") || lower.contains("1 - 2 years") || lower.contains("0-1 years") || lower.contains("0 - 1 years")) {
            return "0-2 years";
        }
        if (lower.contains("3-5 years") || lower.contains("senior") || lower.contains("lead")) {
            return "3+ years";
        }
        return "0-1 years";
    }

    private List<String> extractSkills(String text) {
        String[] candidates = {"Java", "Python", "JavaScript", "TypeScript", "React", "Node.js", "Spring Boot", "SQL", "PostgreSQL", "MongoDB", "AWS", "Docker", "Git", "REST API", "HTML", "CSS", "C++", "Golang", "Kubernetes", "Linux"};
        List<String> found = new ArrayList<>();
        String lower = text.toLowerCase();
        for (String c : candidates) {
            if (lower.contains(c.toLowerCase())) {
                found.add(c);
            }
            if (found.size() >= 5) break;
        }
        return found;
    }
}
