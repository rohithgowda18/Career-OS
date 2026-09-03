package com.eventtracker.coding.repository;

import com.eventtracker.coding.entity.CodingStatsHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CodingStatsHistoryRepository extends JpaRepository<CodingStatsHistory, Long> {

    List<CodingStatsHistory> findByAccountIdOrderByRecordedAtAsc(Long accountId);

    List<CodingStatsHistory> findByAccountUserIdOrderByRecordedAtAsc(Long userId);

    void deleteByAccountId(Long accountId);
}
