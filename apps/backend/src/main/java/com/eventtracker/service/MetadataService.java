package com.eventtracker.service;

import com.eventtracker.dto.MetadataResponseDTO;
import com.eventtracker.util.URLValidationUtil;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class MetadataService {

    private static final int TIMEOUT = 5000;
    private static final String USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

    private static final Map<String, List<String>> EVENT_TYPE_KEYWORDS = new HashMap<>();

    static {
        EVENT_TYPE_KEYWORDS.put("Hackathon", List.of("hackathon", "hack-a-thon", "devpost"));
        EVENT_TYPE_KEYWORDS.put("Workshop", List.of("workshop", "training", "bootcamp"));
        EVENT_TYPE_KEYWORDS.put("Conference", List.of("conference", "summit", "convention", "congress"));
        EVENT_TYPE_KEYWORDS.put("Other", List.of("event", "meetup", "gathering"));
    }

    public MetadataResponseDTO fetchMetadata(String url) {
        if (!URLValidationUtil.isValidURL(url)) {
            return MetadataResponseDTO.builder()
                    .success(false)
                    .error("Invalid or unsafe URL. Please provide a valid http/https URL.")
                    .build();
        }

        try {
            log.info("Fetching metadata from: {}", URLValidationUtil.sanitizeURLForLogging(url));
            Document doc = Jsoup.connect(url)
                    .timeout(TIMEOUT)
                    .userAgent(USER_AGENT)
                    .followRedirects(true)
                    .get();

            MetadataResponseDTO response = extractMetadata(doc);
            response.setUrl(url);
            response.setSuccess(true);
            
            // Detect event type from title and description
            String combinedText = (response.getTitle() != null ? response.getTitle() : "") + " " + 
                                  (response.getDescription() != null ? response.getDescription() : "");
            response.setEventType(detectEventType(combinedText));

            log.info("Successfully extracted metadata for: {}", URLValidationUtil.sanitizeURLForLogging(url));
            return response;

        } catch (IOException e) {
            log.error("Error fetching metadata from {}: {}", url, e.getMessage());
            return MetadataResponseDTO.builder()
                    .success(false)
                    .error("Failed to fetch metadata: " + e.getMessage())
                    .build();
        }
    }

    private MetadataResponseDTO extractMetadata(Document doc) {
        MetadataResponseDTO.MetadataResponseDTOBuilder builder = MetadataResponseDTO.builder();

        // Title
        String title = doc.select("meta[property=og:title]").attr("content");
        if (title.isEmpty()) title = doc.select("meta[name=title]").attr("content");
        if (title.isEmpty()) title = doc.title();
        builder.title(title.length() > 200 ? title.substring(0, 200) : title);

        // Description
        String description = doc.select("meta[property=og:description]").attr("content");
        if (description.isEmpty()) description = doc.select("meta[name=description]").attr("content");
        builder.description(description.length() > 500 ? description.substring(0, 500) : description);

        // Image
        String image = doc.select("meta[property=og:image]").attr("content");
        builder.image(image);

        // Deadline detection
        builder.deadline(detectEventDate(doc));

        return builder.build();
    }

    private LocalDate detectEventDate(Document doc) {
        // 1. Try JSON-LD (most reliable)
        Elements scripts = doc.select("script[type=application/ld+json]");
        for (Element script : scripts) {
            String json = script.html();
            // Simple regex for startDate in JSON-LD
            Pattern pattern = Pattern.compile("\"startDate\"\\s*:\\s*\"([^\"]+)\"");
            Matcher matcher = pattern.matcher(json);
            if (matcher.find()) {
                LocalDate date = parseDate(matcher.group(1));
                if (date != null) return date;
            }
        }

        // 2. Try meta tags
        String[] dateTags = {"event_date", "event-date", "date", "og:published_time", "publish_date", "startDate"};
        for (String tag : dateTags) {
            String content = doc.select("meta[name=" + tag + "]").attr("content");
            if (content.isEmpty()) content = doc.select("meta[property=" + tag + "]").attr("content");
            if (!content.isEmpty()) {
                LocalDate date = parseDate(content);
                if (date != null) return date;
            }
        }

        // 3. Try common date patterns in body text
        String bodyText = doc.body().text();
        return findDateInText(bodyText);
    }

    private String detectEventType(String text) {
        String lowerText = text.toLowerCase();
        for (Map.Entry<String, List<String>> entry : EVENT_TYPE_KEYWORDS.entrySet()) {
            for (String keyword : entry.getValue()) {
                if (lowerText.contains(keyword)) {
                    return entry.getKey();
                }
            }
        }
        return "Other";
    }

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        try {
            // Try ISO format first
            return LocalDate.parse(dateStr.substring(0, 10));
        } catch (DateTimeParseException | IndexOutOfBoundsException e) {
            // Try other formats if needed, or fallback to regex search
            return findDateInText(dateStr);
        }
    }

    private LocalDate findDateInText(String text) {
        // Simplified regex for common date formats
        String[] patterns = {
            "(\\d{4})[-\\/](\\d{1,2})[-\\/](\\d{1,2})", // YYYY-MM-DD
            "(\\d{1,2})[-\\/](\\d{1,2})[-\\/](\\d{4})", // DD-MM-YYYY or MM-DD-YYYY
            "(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\.?\\s+(\\d{1,2}),?\\s+(\\d{4})" // Month Day, Year
        };

        for (String p : patterns) {
            Pattern pattern = Pattern.compile(p, Pattern.CASE_INSENSITIVE);
            Matcher matcher = pattern.matcher(text);
            if (matcher.find()) {
                try {
                    // This is a simplified extraction; a more robust one would handle month names properly
                    if (p.startsWith("(\\d{4})")) {
                         return LocalDate.of(Integer.parseInt(matcher.group(1)), 
                                           Integer.parseInt(matcher.group(2)), 
                                           Integer.parseInt(matcher.group(3)));
                    }
                    // Add more robust parsing here if needed
                } catch (Exception e) {
                    // Ignore and try next pattern
                }
            }
        }
        return null;
    }
}
