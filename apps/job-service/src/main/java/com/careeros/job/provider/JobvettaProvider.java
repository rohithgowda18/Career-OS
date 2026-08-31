package com.careeros.job.provider;

import com.careeros.job.dto.JobDTO;
import com.careeros.job.dto.JobSearchRequest;
import com.careeros.job.dto.JobSearchResponse;
import com.careeros.job.exception.JobProviderException;
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
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Component
public class JobvettaProvider implements JobProvider {

    private final String apiKey;
    private final String baseUrl;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public JobvettaProvider(
            @Value("${app.jobvetta.api-key:${JOBVETTA_API_KEY:}}") String apiKey,
            @Value("${app.jobvetta.base-url:${JOBVETTA_BASE_URL:https://api.jobvetta.com/v1}}") String baseUrl,
            ObjectMapper objectMapper) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.baseUrl = baseUrl != null ? baseUrl.replaceAll("/+$", "") : "https://api.jobvetta.com/v1";
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    @Override
    public boolean isConfigured() {
        return !apiKey.isBlank();
    }

    @Override
    public String getProviderName() {
        return "Jobvetta";
    }

    @Override
    public JobSearchResponse searchJobs(JobSearchRequest request) {
        if (!isConfigured()) {
            throw new JobProviderException(
                    "Jobvetta API key is not configured. Set JOBVETTA_API_KEY in your environment.",
                    503,
                    "PROVIDER_NOT_CONFIGURED"
            );
        }

        try {
            int limit = Math.min(10, Math.max(1, request.getSize()));
            int days = request.getDays() != null ? Math.min(365, Math.max(1, request.getDays())) : 30;

            StringBuilder urlBuilder = new StringBuilder(baseUrl).append("/jobs?");
            urlBuilder.append("limit=").append(limit);
            urlBuilder.append("&days=").append(days);

            // Construct query 'q' combining keyword, jobType, and experience
            StringBuilder queryBuilder = new StringBuilder();
            if (request.getKeyword() != null && !request.getKeyword().isBlank()) {
                queryBuilder.append(request.getKeyword().trim());
            }

            if (request.getJobType() != null && !request.getJobType().isBlank() && !"ALL".equalsIgnoreCase(request.getJobType())) {
                if (queryBuilder.length() > 0) queryBuilder.append(" ");
                queryBuilder.append(request.getJobType().trim());
            }

            if (request.getExperienceLevel() != null && !request.getExperienceLevel().isBlank() && !"ALL".equalsIgnoreCase(request.getExperienceLevel())) {
                if (queryBuilder.length() > 0) queryBuilder.append(" ");
                queryBuilder.append(request.getExperienceLevel().trim());
            }

            if (queryBuilder.length() > 0) {
                urlBuilder.append("&q=").append(URLEncoder.encode(queryBuilder.toString(), StandardCharsets.UTF_8));
            }

            if (request.getLocation() != null && !request.getLocation().isBlank()) {
                urlBuilder.append("&location=").append(URLEncoder.encode(request.getLocation().trim(), StandardCharsets.UTF_8));
            }

            String url = urlBuilder.toString();
            log.debug("Calling Jobvetta search endpoint: {}", url);

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(10))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Accept", "application/json")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            handleErrorStatus(response);

            JsonNode root = objectMapper.readTree(response.body());
            long total = root.path("total").asLong(0);
            JsonNode jobsArray = root.path("jobs");

            List<JobDTO> jobList = new ArrayList<>();
            if (jobsArray.isArray()) {
                for (JsonNode item : jobsArray) {
                    jobList.add(mapJobSummary(item));
                }
            }

            return JobSearchResponse.builder()
                    .jobs(jobList)
                    .total(total)
                    .page(request.getPage())
                    .size(limit)
                    .source(getProviderName())
                    .build();

        } catch (JobProviderException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to query Jobvetta API: {}", e.getMessage());
            throw new JobProviderException("Failed to communicate with Jobvetta API: " + e.getMessage(), 502, "PROVIDER_ERROR", e);
        }
    }

    @Override
    public Optional<JobDTO> getJobById(String jobId) {
        if (!isConfigured() || jobId == null || jobId.isBlank()) {
            return Optional.empty();
        }

        try {
            String url = baseUrl + "/jobs/" + URLEncoder.encode(jobId.trim(), StandardCharsets.UTF_8);
            log.debug("Calling Jobvetta detail endpoint: {}", url);

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(10))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Accept", "application/json")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 404) {
                return Optional.empty();
            }

            handleErrorStatus(response);

            JsonNode root = objectMapper.readTree(response.body());
            return Optional.of(mapJobDetail(root));

        } catch (JobProviderException e) {
            if (e.getStatusCode() == 404) {
                return Optional.empty();
            }
            throw e;
        } catch (Exception e) {
            log.error("Failed to fetch job details from Jobvetta for jobId {}: {}", jobId, e.getMessage());
            throw new JobProviderException("Failed to fetch job details: " + e.getMessage(), 502, "PROVIDER_ERROR", e);
        }
    }

    private void handleErrorStatus(HttpResponse<String> response) {
        int status = response.statusCode();
        if (status >= 200 && status < 300) {
            return;
        }

        String body = response.body();
        log.warn("Jobvetta returned status {}: {}", status, body);

        String errorMsg = "Jobvetta error";
        try {
            JsonNode errorNode = objectMapper.readTree(body);
            if (errorNode.has("error")) {
                errorMsg = errorNode.path("error").asText();
            }
        } catch (Exception ignored) {}

        if (status == 401) {
            throw new JobProviderException("Invalid or expired Jobvetta API key. " + errorMsg, 401, "UNAUTHORIZED");
        } else if (status == 404) {
            throw new JobProviderException("Job not found or no longer active.", 404, "NOT_FOUND");
        } else if (status == 429) {
            throw new JobProviderException("Jobvetta daily rate limit reached (50 requests/day). " + errorMsg, 429, "RATE_LIMITED");
        } else if (status == 502 || status == 503) {
            throw new JobProviderException("Jobvetta backend is temporarily unavailable. Please try again later.", 502, "BACKEND_UNAVAILABLE");
        } else {
            throw new JobProviderException("Jobvetta API error (" + status + "): " + errorMsg, status, "API_ERROR");
        }
    }

    private JobDTO mapJobSummary(JsonNode node) {
        String id = node.path("job_id").asText("");
        String title = node.path("title").asText("");
        String company = node.path("company").asText("Unknown Company");
        String location = node.path("location").asText("");
        String workModel = node.path("work_model").asText("");
        String employmentType = node.path("employment_type").asText("");
        String url = node.path("url").asText("");

        return JobDTO.builder()
                .externalJobId(id)
                .title(title)
                .company(company)
                .location(location)
                .workMode(workModel.isBlank() ? null : workModel)
                .jobType(employmentType.isBlank() ? null : employmentType)
                .source(getProviderName())
                .applyUrl(url)
                .build();
    }

    private JobDTO mapJobDetail(JsonNode node) {
        String id = node.path("job_id").asText("");
        String title = node.path("title").asText("");
        String company = node.path("company").asText("Unknown Company");
        String location = node.path("location").asText("");
        String description = node.path("description").asText("");
        String workModel = node.path("work_model").asText("");
        String employmentType = node.path("employment_type").asText("");
        String experienceLevel = node.path("experience_level").asText("");
        String url = node.path("url").asText("");

        List<String> skills = new ArrayList<>();
        JsonNode skillsNode = node.path("skills_required");
        if (skillsNode.isArray()) {
            for (JsonNode s : skillsNode) {
                skills.add(s.asText());
            }
        }

        String salary = null;
        if (!node.path("salary_min").isNull() || !node.path("salary_max").isNull()) {
            double min = node.path("salary_min").asDouble(0);
            double max = node.path("salary_max").asDouble(0);
            String curr = node.path("salary_currency").asText("INR");
            if (min > 0 && max > 0) {
                salary = String.format("%s %,.0f - %,.0f", curr, min, max);
            } else if (max > 0) {
                salary = String.format("%s Up to %,.0f", curr, max);
            } else if (min > 0) {
                salary = String.format("%s From %,.0f", curr, min);
            }
        }

        String postedAt = null;
        long createdAtSec = node.path("created_at").asLong(0);
        if (createdAtSec > 0) {
            postedAt = Instant.ofEpochSecond(createdAtSec)
                    .atZone(ZoneId.of("Asia/Kolkata"))
                    .format(DateTimeFormatter.ISO_LOCAL_DATE);
        }

        return JobDTO.builder()
                .externalJobId(id)
                .title(title)
                .company(company)
                .location(location)
                .description(description)
                .workMode(workModel.isBlank() ? null : workModel)
                .jobType(employmentType.isBlank() ? null : employmentType)
                .experienceLevel(experienceLevel.isBlank() ? null : experienceLevel)
                .source(getProviderName())
                .applyUrl(url)
                .salary(salary)
                .postedAt(postedAt)
                .skills(skills.isEmpty() ? null : skills)
                .build();
    }
}
