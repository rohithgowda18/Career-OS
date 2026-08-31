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

    Optional<SavedJob> findByUserIdAndExternalJobId(Long userId, String externalJobId);

    Optional<SavedJob> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndExternalJobId(Long userId, String externalJobId);

    List<SavedJob> findByUserId(Long userId);

    void deleteByIdAndUserId(Long id, Long userId);
}
