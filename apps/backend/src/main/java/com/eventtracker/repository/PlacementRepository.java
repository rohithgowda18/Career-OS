package com.eventtracker.repository;

import com.eventtracker.entity.Placement;
import com.eventtracker.entity.PlacementStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlacementRepository extends JpaRepository<Placement, Long> {
    Page<Placement> findByUserId(Long userId, Pageable pageable);
    
    List<Placement> findByUserIdOrderByRegistrationDeadlineAsc(Long userId);
    
    List<Placement> findByUserId(Long userId);
    
    List<Placement> findByUserIdAndStatusOrderByRegistrationDeadlineAsc(Long userId, PlacementStatus status);
    
    Optional<Placement> findByIdAndUserId(Long id, Long userId);
    
    boolean existsByIdAndUserId(Long id, Long userId);
    
    long countByUserId(Long userId);
    
    long countByUserIdAndStatus(Long userId, PlacementStatus status);

    Optional<Placement> findByUserIdAndCompanyNameAndRole(Long userId, String companyName, String role);
}
