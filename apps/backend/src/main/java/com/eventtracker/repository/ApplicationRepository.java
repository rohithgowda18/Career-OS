package com.eventtracker.repository;

import com.eventtracker.entity.Application;
import com.eventtracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByUserIdOrderByDeadlineAsc(Long userId);
    
    List<Application> findByUserId(Long userId);
    
    List<Application> findByUserIdAndStatusOrderByDeadlineAsc(Long userId, Application.ApplicationStatus status);
    
    Optional<Application> findByIdAndUserId(Long id, Long userId);
    
    boolean existsByIdAndUserId(Long id, Long userId);
    
    long countByUserId(Long userId);
    
    long countByUserIdAndStatus(Long userId, Application.ApplicationStatus status);
    
    List<Application> findByUserIdAndEventTypeOrderByDeadlineAsc(Long userId, Application.EventType eventType);

    Optional<Application> findByUserIdAndUrl(Long userId, String url);
}
