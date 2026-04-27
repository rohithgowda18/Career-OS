package com.eventtracker.repository;

import com.eventtracker.entity.EventSuccessScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventSuccessScoreRepository extends JpaRepository<EventSuccessScore, Long> {
    Optional<EventSuccessScore> findByApplicationIdAndUserId(Long applicationId, Long userId);
    List<EventSuccessScore> findByUserId(Long userId);
}
