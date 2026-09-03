package com.careeros.coding.repository;

import com.careeros.coding.entity.CodingStats;
import com.careeros.coding.model.Platform;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CodingStatsRepository extends JpaRepository<CodingStats, Long> {

    Optional<CodingStats> findByAccountId(Long accountId);

    Optional<CodingStats> findByAccountUserIdAndAccountPlatform(Long userId, Platform platform);

    void deleteByAccountId(Long accountId);
}
