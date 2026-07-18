package com.eventtracker.repository;

import com.eventtracker.entity.RoutineTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoutineTaskRepository extends JpaRepository<RoutineTask, Long> {
    List<RoutineTask> findByUserIdOrderByDisplayOrderAscCreatedAtAsc(Long userId);
    Optional<RoutineTask> findByIdAndUserId(Long id, Long userId);
}
