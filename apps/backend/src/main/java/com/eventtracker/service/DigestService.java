package com.eventtracker.service;

import com.eventtracker.entity.Application;
import com.eventtracker.entity.User;
import com.eventtracker.entity.UserPreferences;
import com.eventtracker.repository.ApplicationRepository;
import com.eventtracker.repository.UserPreferencesRepository;
import com.eventtracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DigestService {

    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;
    private final UserPreferencesRepository preferencesRepository;
    private final EmailService emailService;

    public void processAllWeeklyDigests() {
        List<User> users = userRepository.findAll();
        for (User user : users) {
           UserPreferences prefs = preferencesRepository.findByUserId(user.getId()).orElse(null);
           if (prefs != null && prefs.getEmailNotifications()) {
               sendWeeklyDigest(user);
           }
        }
    }

    public void sendWeeklyDigest(User user) {
        List<Application> applications = applicationRepository.findByUserId(user.getId());
        if (applications.isEmpty()) return;

        String subject = "Your Weekly Event Application Digest";
        String htmlContent = generateHtmlDigest(user, applications);
        
        emailService.sendEmail(user.getEmail(), subject, htmlContent, true);
        log.info("Weekly digest sent to {}", user.getEmail());
    }

    private String generateHtmlDigest(User user, List<Application> applications) {
        long total = applications.size();
        long accepted = applications.stream().filter(a -> a.getStatus().name().equals("Accepted")).count();
        double rate = total > 0 ? (double) accepted / total * 100 : 0;

        StringBuilder sb = new StringBuilder();
        sb.append("<html><body style='font-family: Arial, sans-serif;'>");
        sb.append("<h1 style='color: #4A90E2;'>Weekly Application Digest</h1>");
        sb.append("<p>Hi ").append(user.getFirstName()).append(",</p>");
        sb.append("<p>Here is your summary for the week:</p>");
        
        sb.append("<div style='background: #f4f4f4; padding: 15px; border-radius: 8px;'>");
        sb.append("<b>Total Applications:</b> ").append(total).append("<br>");
        sb.append("<b>Accepted:</b> ").append(accepted).append("<br>");
        sb.append("<b>Acceptance Rate:</b> ").append(Math.round(rate)).append("%<br>");
        sb.append("</div>");

        sb.append("<h3>Upcoming Deadlines (Next 7 Days)</h3>");
        List<Application> upcoming = applications.stream()
                .filter(a -> a.getDeadline() != null && a.getDeadline().isAfter(LocalDateTime.now()) && a.getDeadline().isBefore(LocalDateTime.now().plusDays(7)))
                .collect(Collectors.toList());

        if (upcoming.isEmpty()) {
            sb.append("<p>No upcoming deadlines this week.</p>");
        } else {
            sb.append("<ul>");
            for (Application app : upcoming) {
                sb.append("<li><b>").append(app.getEventName()).append("</b> - ")
                  .append(app.getDeadline().format(DateTimeFormatter.ofPattern("MMM dd, yyyy")))
                  .append("</li>");
            }
            sb.append("</ul>");
        }

        sb.append("<p><a href='https://event-tracker.manus.space/dashboard' style='background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>View Dashboard</a></p>");
        sb.append("<p>Best,<br>Event App Tracker Team</p>");
        sb.append("</body></html>");

        return sb.toString();
    }
}
