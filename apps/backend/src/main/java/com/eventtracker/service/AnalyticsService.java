package com.eventtracker.service;

import com.eventtracker.entity.Application;
import com.eventtracker.repository.ApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final ApplicationRepository applicationRepository;

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
}
