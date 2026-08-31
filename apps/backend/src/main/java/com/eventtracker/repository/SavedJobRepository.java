package com.eventtracker.repository;

import com.eventtracker.entity.SavedJob;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedJobRepository extends JpaRepository<SavedJob, Long> {

    Page<SavedJob> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    List<SavedJob> findByUserId(Long userId);

    Optional<SavedJob> findByUserIdAndExternalJobIdAndSource(Long userId, String externalJobId, String source);

    Optional<SavedJob> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndExternalJobIdAndSource(Long userId, String externalJobId, String source);
}
