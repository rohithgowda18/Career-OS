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
    List<Placement> findByUserId(Long userId);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM Placement p WHERE p.user.id = :userId " +
           "AND (:status IS NULL OR p.status = :status)")
    Page<Placement> findFiltered(@org.springframework.data.repository.query.Param("userId") Long userId, 
                                @org.springframework.data.repository.query.Param("status") PlacementStatus status, 
                                Pageable pageable);

    Optional<Placement> findByIdAndUserId(Long id, Long userId);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM Placement p WHERE p.user.id = :userId AND p.companyName = :companyName AND p.role = :role AND " +
           "((:applicationLink IS NULL AND p.applicationLink IS NULL) OR p.applicationLink = :applicationLink)")
    Optional<Placement> findDuplicate(@org.springframework.data.repository.query.Param("userId") Long userId, 
                                      @org.springframework.data.repository.query.Param("companyName") String companyName, 
                                      @org.springframework.data.repository.query.Param("role") String role, 
                                      @org.springframework.data.repository.query.Param("applicationLink") String applicationLink);
}
