package com.eventtracker.service;

import com.eventtracker.entity.Application;
import com.eventtracker.entity.Placement;
import com.eventtracker.entity.PlacementStatus;
import com.eventtracker.repository.ApplicationRepository;
import com.eventtracker.repository.PlacementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.eventtracker.dto.ApplicationDTO;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final ApplicationRepository applicationRepository;
    private final PlacementRepository placementRepository;


    public Map<String, Object> getStatusDistribution(Long userId) {
        List<Application> apps = applicationRepository.findByUserId(userId);
        return apps.stream()
                .collect(Collectors.groupingBy(a -> a.getStatus().name(), Collectors.counting()))
                .entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }

    public Map<String, Object> getAcceptanceRates(Long userId) {
        List<Application> apps = applicationRepository.findByUserId(userId);
        Map<String, List<Application>> byType = apps.stream()
                .collect(Collectors.groupingBy(a -> a.getEventType().name()));

        Map<String, Object> rates = new HashMap<>();
        byType.forEach((type, list) -> {
            long total = list.size();
            long accepted = list.stream().filter(a -> a.getStatus().name().equals("Accepted")).count();
            double rate = total > 0 ? (double) accepted / total * 100 : 0;
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("total", total);
            stats.put("accepted", accepted);
            stats.put("rate", Math.round(rate));
            rates.put(type, stats);
        });
        return rates;
    }

    public Map<String, Object> getSummary(Long userId) {
        List<Application> apps = applicationRepository.findByUserId(userId);
        long total = apps.size();
        long accepted = apps.stream().filter(a -> a.getStatus().name().equals("Accepted")).count();
        long underReview = apps.stream().filter(a -> a.getStatus().name().equals("UnderReview")).count();
        long applied = apps.stream().filter(a -> a.getStatus().name().equals("Applied")).count();
        long interested = apps.stream().filter(a -> a.getStatus().name().equals("Interested")).count();
        long rejected = apps.stream().filter(a -> a.getStatus().name().equals("Rejected")).count();

        double acceptanceRate = total > 0 ? (double) accepted / total * 100 : 0;

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalApplications", total);
        summary.put("accepted", accepted);
        summary.put("underReview", underReview);
        summary.put("applied", applied);
        summary.put("interested", interested);
        summary.put("rejected", rejected);
        summary.put("overallAcceptanceRate", Math.round(acceptanceRate));
        return summary;
    }

    public Map<String, Object> getDashboardData(Long userId) {
        List<Application> allApps = applicationRepository.findByUserId(userId);
        long total = allApps.size();

        // Status distribution across ALL applications
        Map<String, Long> statusDistribution = allApps.stream()
                .collect(Collectors.groupingBy(
                        a -> a.getStatus().name(),
                        Collectors.counting()
                ));

        // Upcoming deadlines within 7 days (sorted by deadline ascending)
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime sevenDaysFromNow = now.plusDays(7);
        List<ApplicationDTO> upcomingDeadlines = allApps.stream()
                .filter(app -> app.getDeadline() != null)
                .filter(app -> {
                    LocalDateTime deadline = app.getDeadline();
                    return deadline.isAfter(now) && deadline.isBefore(sevenDaysFromNow);
                })
                .sorted((a, b) -> a.getDeadline().compareTo(b.getDeadline()))
                .limit(5)
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        long upcomingDeadlinesCount = allApps.stream()
                .filter(app -> app.getDeadline() != null)
                .filter(app -> {
                    LocalDateTime deadline = app.getDeadline();
                    return deadline.isAfter(now) && deadline.isBefore(sevenDaysFromNow);
                })
                .count();

        // Recent activity (5 most recently created)
        List<ApplicationDTO> recentActivity = allApps.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(5)
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        // Build response
        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("totalApplications", total);
        dashboard.put("upcomingDeadlines", upcomingDeadlinesCount);
        dashboard.put("statusDistribution", statusDistribution);
        dashboard.put("immediateDeadlines", upcomingDeadlines);
        dashboard.put("recentActivity", recentActivity);
        return dashboard;
    }

    private ApplicationDTO convertToDTO(Application app) {
        ApplicationDTO dto = new ApplicationDTO();
        dto.setId(app.getId());
        dto.setEventName(app.getEventName());
        dto.setEventType(app.getEventType().toString());
        dto.setStatus(app.getStatus().toString());
        dto.setDeadline(app.getDeadline());
        dto.setNotes(app.getNotes());
        dto.setUrl(app.getUrl());
        dto.setLocation(app.getLocation());
        dto.setCreatedAt(app.getCreatedAt());
        dto.setUpdatedAt(app.getUpdatedAt());
        return dto;
    }

    public Map<String, Object> getPlacementAnalytics(Long userId) {
        List<Placement> placements = placementRepository.findByUserId(userId);
        long total = placements.size();

        long saved = 0;
        long applied = placements.stream().filter(p -> p.getStatus() == PlacementStatus.APPLIED).count();
        long assessmentScheduled = placements.stream().filter(p -> p.getStatus() == PlacementStatus.ASSESSMENT_SCHEDULED).count();
        long assessmentCompleted = placements.stream().filter(p -> p.getStatus() == PlacementStatus.ASSESSMENT_COMPLETED).count();
        long interviewScheduled = placements.stream().filter(p -> p.getStatus() == PlacementStatus.INTERVIEW_SCHEDULED).count();
        long interviewCompleted = placements.stream().filter(p -> p.getStatus() == PlacementStatus.INTERVIEW_COMPLETED).count();
        long offerReceived = placements.stream().filter(p -> p.getStatus() == PlacementStatus.OFFER_RECEIVED).count();
        long rejected = placements.stream().filter(p -> p.getStatus() == PlacementStatus.REJECTED).count();

        // Applications Submitted = total - saved
        long submitted = total - saved;

        // Assessments reached/scheduled = assessmentScheduled + assessmentCompleted + interviewScheduled + interviewCompleted + offerReceived
        long assessments = assessmentScheduled + assessmentCompleted + interviewScheduled + interviewCompleted + offerReceived;

        // Interviews reached/scheduled = interviewScheduled + interviewCompleted + offerReceived
        long interviews = interviewScheduled + interviewCompleted + offerReceived;

        double assessmentConversion = submitted > 0 ? (double) assessments / submitted * 100 : 0;
        double interviewConversion = assessments > 0 ? (double) interviews / assessments * 100 : 0;
        double offerConversion = applied > 0 ? (double) offerReceived / applied * 100 : 0;

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalPlacements", total);
        stats.put("saved", saved);
        stats.put("applied", applied);
        stats.put("assessmentScheduled", assessmentScheduled);
        stats.put("assessmentCompleted", assessmentCompleted);
        stats.put("interviewScheduled", interviewScheduled);
        stats.put("interviewCompleted", interviewCompleted);
        stats.put("offerReceived", offerReceived);
        stats.put("rejected", rejected);
        stats.put("submitted", submitted);
        stats.put("assessmentConversion", Math.round(assessmentConversion));
        stats.put("interviewConversion", Math.round(interviewConversion));
        stats.put("offerConversion", Math.round(offerConversion));

        // Status distribution map
        Map<String, Long> statusDistribution = placements.stream()
                .collect(Collectors.groupingBy(p -> p.getStatus().name(), Collectors.counting()));
        stats.put("statusDistribution", statusDistribution);

        return stats;
    }

    public Map<String, Object> getPlacementSummary(Long userId) {
        List<Placement> placements = placementRepository.findByUserId(userId);
        long total = placements.size();
        long applied = placements.stream().filter(p -> p.getStatus() == PlacementStatus.APPLIED).count();
        long assessmentScheduled = placements.stream().filter(p -> p.getStatus() == PlacementStatus.ASSESSMENT_SCHEDULED).count();
        long assessmentCompleted = placements.stream().filter(p -> p.getStatus() == PlacementStatus.ASSESSMENT_COMPLETED).count();
        long interviewScheduled = placements.stream().filter(p -> p.getStatus() == PlacementStatus.INTERVIEW_SCHEDULED).count();
        long interviewCompleted = placements.stream().filter(p -> p.getStatus() == PlacementStatus.INTERVIEW_COMPLETED).count();
        long offerReceived = placements.stream().filter(p -> p.getStatus() == PlacementStatus.OFFER_RECEIVED).count();
        long rejected = placements.stream().filter(p -> p.getStatus() == PlacementStatus.REJECTED).count();

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalPlacements", total);
        summary.put("saved", 0L);
        summary.put("applied", applied);
        summary.put("assessmentScheduled", assessmentScheduled);
        summary.put("assessmentCompleted", assessmentCompleted);
        summary.put("interviewScheduled", interviewScheduled);
        summary.put("interviewCompleted", interviewCompleted);
        summary.put("offerReceived", offerReceived);
        summary.put("rejected", rejected);
        summary.put("submitted", total);
        return summary;
    }

    public Map<String, Long> getPlacementStatusDistribution(Long userId) {
        List<Placement> placements = placementRepository.findByUserId(userId);
        return placements.stream()
                .collect(Collectors.groupingBy(p -> p.getStatus().name(), Collectors.counting()));
    }

    public Map<String, Object> getPlacementConversionRates(Long userId) {
        List<Placement> placements = placementRepository.findByUserId(userId);
        long total = placements.size();

        long applied = placements.stream().filter(p -> p.getStatus() == PlacementStatus.APPLIED).count();
        long assessmentScheduled = placements.stream().filter(p -> p.getStatus() == PlacementStatus.ASSESSMENT_SCHEDULED).count();
        long assessmentCompleted = placements.stream().filter(p -> p.getStatus() == PlacementStatus.ASSESSMENT_COMPLETED).count();
        long interviewScheduled = placements.stream().filter(p -> p.getStatus() == PlacementStatus.INTERVIEW_SCHEDULED).count();
        long interviewCompleted = placements.stream().filter(p -> p.getStatus() == PlacementStatus.INTERVIEW_COMPLETED).count();
        long offerReceived = placements.stream().filter(p -> p.getStatus() == PlacementStatus.OFFER_RECEIVED).count();

        long assessments = assessmentScheduled + assessmentCompleted + interviewScheduled + interviewCompleted + offerReceived;
        long interviews = interviewScheduled + interviewCompleted + offerReceived;

        double assessmentConversion = total > 0 ? (double) assessments / total * 100 : 0;
        double interviewConversion = assessments > 0 ? (double) interviews / assessments * 100 : 0;
        double offerConversion = applied > 0 ? (double) offerReceived / applied * 100 : 0;

        Map<String, Object> conversion = new HashMap<>();
        conversion.put("assessmentConversion", Math.round(assessmentConversion));
        conversion.put("interviewConversion", Math.round(interviewConversion));
        conversion.put("offerConversion", Math.round(offerConversion));
        return conversion;
    }

    public List<Map<String, Object>> getPlacementTrends(Long userId) {
        List<Placement> placements = placementRepository.findByUserId(userId);
        Map<String, Long> trendsMap = placements.stream()
                .filter(p -> p.getCreatedAt() != null)
                .collect(Collectors.groupingBy(
                        p -> p.getCreatedAt().getYear() + "-" + String.format("%02d", p.getCreatedAt().getMonthValue()),
                        Collectors.counting()
                ));
        return trendsMap.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    Map<String, Object> point = new HashMap<>();
                    point.put("month", entry.getKey());
                    point.put("count", entry.getValue());
                    return point;
                })
                .collect(Collectors.toList());
    }
}

