package com.eventtracker.repository;

import com.eventtracker.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findByApplicationId(Long applicationId);
    List<Team> findByCreatorId(Long creatorId);
}
