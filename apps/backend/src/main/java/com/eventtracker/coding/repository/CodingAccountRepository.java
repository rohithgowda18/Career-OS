package com.eventtracker.coding.repository;

import com.eventtracker.coding.entity.CodingAccount;
import com.eventtracker.coding.entity.Platform;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CodingAccountRepository extends JpaRepository<CodingAccount, Long> {

    List<CodingAccount> findByUserId(Long userId);

    Optional<CodingAccount> findByIdAndUserId(Long id, Long userId);

    Optional<CodingAccount> findByUserIdAndPlatform(Long userId, Platform platform);

    boolean existsByUserIdAndPlatform(Long userId, Platform platform);
}
