package com.eventtracker.service;

import com.eventtracker.dto.RoutineDTO;
import com.eventtracker.dto.RoutineReportDTO;
import com.eventtracker.entity.RoutineTask;
import com.eventtracker.entity.RoutineCompletion;
import com.eventtracker.entity.User;
import com.eventtracker.repository.RoutineTaskRepository;
import com.eventtracker.repository.RoutineCompletionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class RoutineService {

    private final RoutineTaskRepository routineTaskRepository;
    private final RoutineCompletionRepository routineCompletionRepository;

    public RoutineTask createTask(User user, RoutineDTO dto) {
        RoutineTask task = new RoutineTask();
        task.setUser(user);
        task.setTitle(dto.getTitle().trim());
        task.setDisplayOrder(dto.getDisplayOrder());
        return routineTaskRepository.save(task);
    }

    public List<RoutineDTO> getRoutines(Long userId) {
        LocalDate today = LocalDate.now();
        List<RoutineTask> tasks = routineTaskRepository.findByUserIdOrderByDisplayOrderAscCreatedAtAsc(userId);
        List<Long> ids = tasks.stream().map(RoutineTask::getId).collect(Collectors.toList());
        
        Map<Long, Boolean> completionMap = routineCompletionRepository
                .findByRoutineTaskIdInAndCompletionDate(ids, today).stream()
                .collect(Collectors.toMap(c -> c.getRoutineTask().getId(), RoutineCompletion::isCompleted, (a, b) -> a));

        return tasks.stream()
                .map(r -> convertToDTO(r, completionMap.getOrDefault(r.getId(), false)))
                .collect(Collectors.toList());
    }

    public RoutineTask getTask(Long id, Long userId) {
        return routineTaskRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found or access denied"));
    }

    public RoutineTask updateTask(Long id, Long userId, RoutineDTO dto) {
        RoutineTask task = getTask(id, userId);
        if (dto.getTitle() != null) {
            task.setTitle(dto.getTitle().trim());
        }
        task.setDisplayOrder(dto.getDisplayOrder());
        return routineTaskRepository.save(task);
    }

    public RoutineCompletion toggleCompletion(Long id, Long userId) {
        RoutineTask task = getTask(id, userId);
        LocalDate today = LocalDate.now();

        Optional<RoutineCompletion> existing = routineCompletionRepository.findByRoutineTaskIdAndCompletionDate(id, today);
        if (existing.isPresent()) {
            RoutineCompletion comp = existing.get();
            comp.setCompleted(!comp.isCompleted());
            return routineCompletionRepository.save(comp);
        } else {
            RoutineCompletion comp = new RoutineCompletion();
            comp.setRoutineTask(task);
            comp.setCompletionDate(today);
            comp.setCompleted(true);
            return routineCompletionRepository.save(comp);
        }
    }

    public void deleteTask(Long id, Long userId) {
        RoutineTask task = getTask(id, userId);
        routineTaskRepository.delete(task);
    }

    public RoutineReportDTO getReports(Long userId) {
        List<RoutineTask> tasks = routineTaskRepository.findByUserIdOrderByDisplayOrderAscCreatedAtAsc(userId);
        int totalCount = tasks.size();
        
        RoutineReportDTO report = new RoutineReportDTO();
        report.setWeeklyCompletion(new LinkedHashMap<>());
        report.setWeeklyAverage(0.0);
        report.setCurrentStreak(0);
        report.setLongestStreak(0);
        report.setBestDay("N/A");

        if (totalCount == 0) {
            for (DayOfWeek day : DayOfWeek.values()) {
                report.getWeeklyCompletion().put(day.toString(), 0.0);
            }
            return report;
        }

        List<Long> ids = tasks.stream().map(RoutineTask::getId).collect(Collectors.toList());
        LocalDate today = LocalDate.now();
        LocalDate startOfWeek = today.with(java.time.temporal.TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        // Get completions for the current week
        List<RoutineCompletion> weekCompletions = routineCompletionRepository
                .findByRoutineTaskIdInAndCompletionDateBetween(ids, startOfWeek, startOfWeek.plusDays(6));

        Map<LocalDate, Long> weekCompletionsMap = weekCompletions.stream()
                .filter(RoutineCompletion::isCompleted)
                .collect(Collectors.groupingBy(RoutineCompletion::getCompletionDate, Collectors.counting()));

        double totalWeeklyPercentage = 0.0;
        for (int i = 0; i < 7; i++) {
            LocalDate date = startOfWeek.plusDays(i);
            long completedCount = weekCompletionsMap.getOrDefault(date, 0L);
            double percentage = Math.round(((double) completedCount / totalCount) * 100.0);
            report.getWeeklyCompletion().put(date.getDayOfWeek().toString(), percentage);
            totalWeeklyPercentage += percentage;
        }
        report.setWeeklyAverage(Math.round(totalWeeklyPercentage / 7.0));

        // Fetch all completions to calculate streaks
        List<RoutineCompletion> allCompletions = routineCompletionRepository.findByRoutineTaskIdIn(ids);
        Map<LocalDate, Long> completionsByDate = allCompletions.stream()
                .filter(RoutineCompletion::isCompleted)
                .collect(Collectors.groupingBy(RoutineCompletion::getCompletionDate, Collectors.counting()));

        // Streak Calculation
        Set<LocalDate> completedDays = completionsByDate.entrySet().stream()
                .filter(entry -> entry.getValue() >= totalCount)
                .map(Map.Entry::getKey)
                .collect(Collectors.toSet());

        int currentStreak = 0;
        LocalDate streakCheck = today;
        if (!completedDays.contains(streakCheck)) {
            streakCheck = today.minusDays(1);
        }
        while (completedDays.contains(streakCheck)) {
            currentStreak++;
            streakCheck = streakCheck.minusDays(1);
        }
        report.setCurrentStreak(currentStreak);

        int longestStreak = 0;
        if (!completedDays.isEmpty()) {
            List<LocalDate> sortedDates = new ArrayList<>(completedDays);
            Collections.sort(sortedDates);
            int tempStreak = 0;
            LocalDate prevDate = null;
            for (LocalDate d : sortedDates) {
                if (prevDate == null || d.equals(prevDate.plusDays(1))) {
                    tempStreak++;
                } else {
                    longestStreak = Math.max(longestStreak, tempStreak);
                    tempStreak = 1;
                }
                prevDate = d;
            }
            longestStreak = Math.max(longestStreak, tempStreak);
        }
        report.setLongestStreak(longestStreak);

        // Best Day of Week
        Map<DayOfWeek, List<Double>> completionsByDayOfWeek = new EnumMap<>(DayOfWeek.class);
        for (DayOfWeek d : DayOfWeek.values()) {
            completionsByDayOfWeek.put(d, new ArrayList<>());
        }

        completionsByDate.forEach((date, count) -> {
            double pct = ((double) count / totalCount) * 100.0;
            completionsByDayOfWeek.get(date.getDayOfWeek()).add(pct);
        });

        DayOfWeek bestDayOfWeek = null;
        double highestAvg = -1.0;
        for (Map.Entry<DayOfWeek, List<Double>> entry : completionsByDayOfWeek.entrySet()) {
            List<Double> pcts = entry.getValue();
            if (!pcts.isEmpty()) {
                double sum = pcts.stream().mapToDouble(Double::doubleValue).sum();
                double avg = sum / pcts.size();
                if (avg > highestAvg) {
                    highestAvg = avg;
                    bestDayOfWeek = entry.getKey();
                }
            }
        }
        if (bestDayOfWeek != null) {
            report.setBestDay(bestDayOfWeek.toString());
        }

        return report;
    }

    public RoutineDTO convertToDTO(RoutineTask task, boolean completed) {
        RoutineDTO dto = new RoutineDTO();
        dto.setId(task.getId());
        dto.setUserId(task.getUser().getId());
        dto.setTitle(task.getTitle());
        dto.setDisplayOrder(task.getDisplayOrder());
        dto.setCompleted(completed);
        dto.setCreatedAt(task.getCreatedAt());
        dto.setUpdatedAt(task.getUpdatedAt());
        return dto;
    }
}
