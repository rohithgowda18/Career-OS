package com.eventtracker.repository;

import com.eventtracker.entity.Skill;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SkillRepository extends JpaRepository<Skill, Long> {
    Page<Skill> findByUserId(Long userId, Pageable pageable);

    Page<Skill> findByUserIdAndNameContainingIgnoreCase(Long userId, String name, Pageable pageable);

    boolean existsByUserIdAndNameIgnoreCase(Long userId, String name);

    Optional<Skill> findByUserIdAndNameIgnoreCase(Long userId, String name);
}
