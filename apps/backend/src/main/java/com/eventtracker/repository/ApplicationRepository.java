package com.eventtracker.repository;

import com.eventtracker.entity.Application;
import com.eventtracker.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    Page<Application> findByUserId(Long userId, Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT a FROM Application a WHERE a.user.id = :userId " +
           "AND (:status IS NULL OR a.status = :status) " +
           "AND (:search IS NULL OR LOWER(a.eventName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(a.location) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(a.notes) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Application> findFiltered(@org.springframework.data.repository.query.Param("userId") Long userId, 
                                  @org.springframework.data.repository.query.Param("status") Application.ApplicationStatus status, 
                                  @org.springframework.data.repository.query.Param("search") String search, 
                                  Pageable pageable);
    
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
