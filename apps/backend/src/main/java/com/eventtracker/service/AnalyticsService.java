package com.eventtracker.service;

import com.eventtracker.entity.Application;
import com.eventtracker.entity.Placement;
import com.eventtracker.entity.PlacementStatus;
import com.eventtracker.repository.ApplicationRepository;
import com.eventtracker.repository.PlacementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.eventtracker.dto.ApplicationDTO;
import com.eventtracker.dto.PlacementDTO;

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
        List<Placement> allPlacements = placementRepository.findByUserId(userId);
        long totalApps = allApps.size();

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime todayStart = now.toLocalDate().atStartOfDay();
        LocalDateTime todayEnd = now.toLocalDate().atTime(23, 59, 59, 999999999);
        LocalDateTime tomorrowStart = todayEnd.plusNanos(1);
        LocalDateTime sevenDaysFromNowEnd = todayEnd.plusDays(7);

        // Deadlines Today (Applications)
        List<ApplicationDTO> deadlinesToday = allApps.stream()
                .filter(app -> app.getDeadline() != null && !app.getDeadline().isBefore(todayStart) && !app.getDeadline().isAfter(todayEnd))
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        // Interviews This Week (Placements in next 7 days starting today)
        long interviewsThisWeek = allPlacements.stream()
                .filter(p -> p.getStatus() == PlacementStatus.INTERVIEW_SCHEDULED && p.getInterviewDate() != null && !p.getInterviewDate().isBefore(todayStart) && !p.getInterviewDate().isAfter(sevenDaysFromNowEnd))
                .count();

        // Awaiting Responses (Placements with active pending statuses)
        long awaitingResponses = allPlacements.stream()
                .filter(p -> p.getStatus() == PlacementStatus.APPLIED 
                        || p.getStatus() == PlacementStatus.ASSESSMENT_SCHEDULED 
                        || p.getStatus() == PlacementStatus.ASSESSMENT_COMPLETED 
                        || p.getStatus() == PlacementStatus.INTERVIEW_SCHEDULED 
                        || p.getStatus() == PlacementStatus.INTERVIEW_COMPLETED)
                .count();

        // Offers Awaiting Decision (Placements with status OFFER_RECEIVED)
        long offersAwaitingDecision = allPlacements.stream()
                .filter(p -> p.getStatus() == PlacementStatus.OFFER_RECEIVED)
                .count();

        // Upcoming Deadlines (Applications, next 7 days excluding today)
        List<ApplicationDTO> upcomingDeadlines = allApps.stream()
                .filter(app -> app.getDeadline() != null && !app.getDeadline().isBefore(tomorrowStart) && !app.getDeadline().isAfter(sevenDaysFromNowEnd))
                .sorted((a, b) -> a.getDeadline().compareTo(b.getDeadline()))
                .limit(5)
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        long upcomingDeadlinesCount = allApps.stream()
                .filter(app -> app.getDeadline() != null && !app.getDeadline().isBefore(tomorrowStart) && !app.getDeadline().isAfter(sevenDaysFromNowEnd))
                .count();

        // Awaiting Feedback (Applications, top 4 pending: Applied or UnderReview)
        List<ApplicationDTO> awaitingFeedback = allApps.stream()
                .filter(app -> app.getStatus() == Application.ApplicationStatus.Applied || app.getStatus() == Application.ApplicationStatus.UnderReview)
                .sorted((a, b) -> {
                    if (a.getDeadline() == null && b.getDeadline() == null) return 0;
                    if (a.getDeadline() == null) return 1;
                    if (b.getDeadline() == null) return -1;
                    return a.getDeadline().compareTo(b.getDeadline());
                })
                .limit(4)
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        // Pipeline Distribution (All 5 Application statuses)
        Map<String, Long> pipelineDistribution = new HashMap<>();
        for (Application.ApplicationStatus status : Application.ApplicationStatus.values()) {
            pipelineDistribution.put(status.name(), 0L);
        }
        allApps.forEach(app -> {
            String statusName = app.getStatus().name();
            pipelineDistribution.put(statusName, pipelineDistribution.get(statusName) + 1);
        });

        // Recent Activity (Applications, 5 most recently updated, sorted by updatedAt descending)
        List<ApplicationDTO> recentActivity = allApps.stream()
                .sorted((a, b) -> b.getUpdatedAt().compareTo(a.getUpdatedAt()))
                .limit(5)
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        // Today's priorities details (for Placements)
        List<PlacementDTO> placementAssessmentsToday = allPlacements.stream()
                .filter(p -> p.getAssessmentDate() != null && !p.getAssessmentDate().isBefore(todayStart) && !p.getAssessmentDate().isAfter(todayEnd))
                .map(this::convertPlacementToDTO)
                .collect(Collectors.toList());

        List<PlacementDTO> placementInterviewsToday = allPlacements.stream()
                .filter(p -> p.getInterviewDate() != null && !p.getInterviewDate().isBefore(todayStart) && !p.getInterviewDate().isAfter(todayEnd))
                .map(this::convertPlacementToDTO)
                .collect(Collectors.toList());

        // Build response
        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("totalApplications", totalApps);
        dashboard.put("deadlinesToday", deadlinesToday);
        dashboard.put("deadlinesTodayCount", deadlinesToday.size());
        dashboard.put("interviewsThisWeek", interviewsThisWeek);
        dashboard.put("awaitingResponses", awaitingResponses);
        dashboard.put("offersAwaitingDecision", offersAwaitingDecision);
        dashboard.put("upcomingDeadlines", upcomingDeadlines);
        dashboard.put("upcomingDeadlinesCount", upcomingDeadlinesCount);
        dashboard.put("awaitingFeedback", awaitingFeedback);
        dashboard.put("pipelineDistribution", pipelineDistribution);
        dashboard.put("recentActivity", recentActivity);
        dashboard.put("placementAssessmentsToday", placementAssessmentsToday);
        dashboard.put("placementInterviewsToday", placementInterviewsToday);
        return dashboard;
    }

    private PlacementDTO convertPlacementToDTO(Placement p) {
        PlacementDTO dto = new PlacementDTO();
        dto.setId(p.getId());
        dto.setUserId(p.getUser().getId());
        dto.setCompanyName(p.getCompanyName());
        dto.setRole(p.getRole());
        dto.setLocation(p.getLocation());
        dto.setStipend(p.getStipend());
        dto.setCtc(p.getCtc());
        dto.setApplicationLink(p.getApplicationLink());
        dto.setAssessmentDate(p.getAssessmentDate());
        dto.setInterviewDate(p.getInterviewDate());
        dto.setStatus(p.getStatus().name());
        dto.setCreatedAt(p.getCreatedAt());
        dto.setUpdatedAt(p.getUpdatedAt());
        return dto;
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

        // Applications Submitted = total
        long submitted = total;

        // Assessments reached/scheduled = assessmentScheduled + assessmentCompleted + interviewScheduled + interviewCompleted + offerReceived
        long assessments = assessmentScheduled + assessmentCompleted + interviewScheduled + interviewCompleted + offerReceived;

        // Interviews reached/scheduled = interviewScheduled + interviewCompleted + offerReceived
        long interviews = interviewScheduled + interviewCompleted + offerReceived;

        double assessmentConversion = submitted > 0 ? (double) assessments / submitted * 100 : 0;
        double interviewConversion = assessments > 0 ? (double) interviews / assessments * 100 : 0;
        double offerConversion = total > 0 ? (double) offerReceived / total * 100 : 0;

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalPlacements", total);
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
        double offerConversion = total > 0 ? (double) offerReceived / total * 100 : 0;

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

