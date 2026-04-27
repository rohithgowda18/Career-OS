package com.eventtracker.repository;

import com.eventtracker.entity.CalendarConflict;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CalendarConflictRepository extends JpaRepository<CalendarConflict, Long> {
    List<CalendarConflict> findByUserId(Long userId);
    List<CalendarConflict> findByUserIdAndIsResolved(Long userId, Boolean isResolved);
}
