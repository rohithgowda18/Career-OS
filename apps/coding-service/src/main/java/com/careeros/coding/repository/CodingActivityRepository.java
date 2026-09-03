package com.careeros.coding.repository;

import com.careeros.coding.entity.CodingActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CodingActivityRepository extends JpaRepository<CodingActivity, Long> {

    Optional<CodingActivity> findByAccountIdAndActivityDate(Long accountId, LocalDate activityDate);

    List<CodingActivity> findByAccountId(Long accountId);

    @Query("SELECT ca FROM CodingActivity ca JOIN FETCH ca.account a WHERE a.userId = :userId ORDER BY ca.activityDate ASC")
    List<CodingActivity> findByUserId(@Param("userId") Long userId);

    @Query("SELECT ca FROM CodingActivity ca JOIN FETCH ca.account a WHERE a.userId = :userId AND ca.activityDate BETWEEN :startDate AND :endDate ORDER BY ca.activityDate ASC")
    List<CodingActivity> findByUserIdAndDateRange(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Modifying
    @Query("DELETE FROM CodingActivity ca WHERE ca.account.id = :accountId")
    void deleteByAccountId(@Param("accountId") Long accountId);
}
