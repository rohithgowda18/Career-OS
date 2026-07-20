package com.eventtracker.repository;

import com.eventtracker.entity.Application;
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
           "AND (:eventType IS NULL OR a.eventType = :eventType)")
    Page<Application> findFiltered(@org.springframework.data.repository.query.Param("userId") Long userId,
                                   @org.springframework.data.repository.query.Param("status") Application.ApplicationStatus status,
                                   @org.springframework.data.repository.query.Param("eventType") Application.EventType eventType,
                                   Pageable pageable);

    List<Application> findByUserId(Long userId);
    
    Optional<Application> findByIdAndUserId(Long id, Long userId);
    
    Optional<Application> findByUserIdAndUrl(Long userId, String url);
}
