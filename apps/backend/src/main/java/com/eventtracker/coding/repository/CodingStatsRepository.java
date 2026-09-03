package com.eventtracker.coding.repository;

import com.eventtracker.coding.entity.CodingStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CodingStatsRepository extends JpaRepository<CodingStats, Long> {

    Optional<CodingStats> findByAccountId(Long accountId);

    Optional<CodingStats> findByAccountUserIdAndAccountPlatform(Long userId, com.eventtracker.coding.entity.Platform platform);

    void deleteByAccountId(Long accountId);
}
