package com.eventtracker.service;

import com.eventtracker.entity.Application;
import com.eventtracker.entity.CalendarConflict;
import com.eventtracker.repository.ApplicationRepository;
import com.eventtracker.repository.CalendarConflictRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConflictDetectionService {

    private final CalendarConflictRepository conflictRepository;
    private final ApplicationRepository applicationRepository;

    @Transactional
    public List<CalendarConflict> detectAndStoreConflicts(Long userId, LocalDateTime start, LocalDateTime end) {
        List<Application> apps = applicationRepository.findByUserId(userId);
        List<CalendarConflict> newConflicts = new ArrayList<>();

        for (int i = 0; i < apps.size(); i++) {
            Application app1 = apps.get(i);
            if (app1.getDeadline() == null || app1.getStatus().name().equals("Withdrawn")) continue;
            if (app1.getDeadline().isBefore(start) || app1.getDeadline().isAfter(end)) continue;

            for (int j = i + 1; j < apps.size(); j++) {
                Application app2 = apps.get(j);
                if (app2.getDeadline() == null || app2.getStatus().name().equals("Withdrawn")) continue;

                // Simple conflict: same day
                if (app1.getDeadline().toLocalDate().equals(app2.getDeadline().toLocalDate())) {
                    CalendarConflict conflict = new CalendarConflict();
                    conflict.setUser(app1.getUser());
                    conflict.setApplication1(app1);
                    conflict.setApplication2(app2);
                    conflict.setConflictDateStart(app1.getDeadline());
                    conflict.setConflictDateEnd(app2.getDeadline());
                    
                    // Smart recommendation logic
                    conflict.setRecommendedApplication(getSmartRecommendation(app1, app2));
                    
                    newConflicts.add(conflictRepository.save(conflict));
                }
            }
        }
        return newConflicts;
    }

    private Application getSmartRecommendation(Application app1, Application app2) {
        // Simple scoring: prioritize higher success score if available
        double score1 = app1.getSuccessScore() != null ? app1.getSuccessScore() : 50.0;
        double score2 = app2.getSuccessScore() != null ? app2.getSuccessScore() : 50.0;

        // Add urgency factor (closer deadline = higher priority if they were different, 
        // but here they are same day, so we look at application history or favorite status)
        if (app1.getIsFavorite() && !app2.getIsFavorite()) return app1;
        if (app2.getIsFavorite() && !app1.getIsFavorite()) return app2;

        return score1 >= score2 ? app1 : app2;
    }

    @Transactional
    public void resolveConflict(Long conflictId) {
        CalendarConflict conflict = conflictRepository.findById(conflictId)
                .orElseThrow(() -> new IllegalArgumentException("Conflict not found"));
        conflict.setIsResolved(true);
        conflictRepository.save(conflict);
    }

    public List<CalendarConflict> getUnresolvedConflicts(Long userId) {
        return conflictRepository.findByUserIdAndIsResolved(userId, false);
    }
}
