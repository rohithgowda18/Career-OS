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
        Page<Application> findByUserIdOrderByDeadlineAsc(Long userId, Pageable pageable);

        Page<Application> findByUserIdAndStatusOrderByDeadlineAsc(Long userId, Application.ApplicationStatus status,
                        Pageable pageable);

        List<Application> findByUserId(Long userId);

        Optional<Application> findByIdAndUserId(Long id, Long userId);

        Optional<Application> findByUserIdAndUrl(Long userId, String url);
}
