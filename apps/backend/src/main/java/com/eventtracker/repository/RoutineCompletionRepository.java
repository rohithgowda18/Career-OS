package com.eventtracker.repository;

import com.eventtracker.entity.RoutineCompletion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface RoutineCompletionRepository extends JpaRepository<RoutineCompletion, Long> {
    Optional<RoutineCompletion> findByRoutineTaskIdAndCompletionDate(Long routineTaskId, LocalDate date);
    List<RoutineCompletion> findByRoutineTaskIdInAndCompletionDate(List<Long> routineTaskIds, LocalDate date);
    List<RoutineCompletion> findByRoutineTaskIdIn(List<Long> routineTaskIds);
    List<RoutineCompletion> findByRoutineTaskIdInAndCompletionDateBetween(List<Long> routineTaskIds, LocalDate startDate, LocalDate endDate);
}
