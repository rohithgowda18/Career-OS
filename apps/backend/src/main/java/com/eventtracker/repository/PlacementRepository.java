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

    @org.springframework.data.jpa.repository.Query("SELECT p FROM Placement p WHERE p.user.id = :userId " +
           "AND (:status IS NULL OR p.status = :status) " +
           "AND (CAST(:search AS string) IS NULL OR LOWER(p.companyName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR LOWER(p.role) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR LOWER(p.location) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))")
    Page<Placement> findFiltered(@org.springframework.data.repository.query.Param("userId") Long userId, 
                                @org.springframework.data.repository.query.Param("status") PlacementStatus status, 
                                @org.springframework.data.repository.query.Param("search") String search, 
                                Pageable pageable);
    
    List<Placement> findByUserIdOrderByIdDesc(Long userId);
    
    List<Placement> findByUserId(Long userId);
    
    List<Placement> findByUserIdAndStatusOrderByIdDesc(Long userId, PlacementStatus status);
    
    Optional<Placement> findByIdAndUserId(Long id, Long userId);
    
    boolean existsByIdAndUserId(Long id, Long userId);
    
    long countByUserId(Long userId);
    
    long countByUserIdAndStatus(Long userId, PlacementStatus status);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM Placement p WHERE p.user.id = :userId AND p.companyName = :companyName AND p.role = :role AND " +
           "((:applicationLink IS NULL AND p.applicationLink IS NULL) OR p.applicationLink = :applicationLink)")
    Optional<Placement> findDuplicate(@org.springframework.data.repository.query.Param("userId") Long userId, 
                                      @org.springframework.data.repository.query.Param("companyName") String companyName, 
                                      @org.springframework.data.repository.query.Param("role") String role, 
                                      @org.springframework.data.repository.query.Param("applicationLink") String applicationLink);
}
