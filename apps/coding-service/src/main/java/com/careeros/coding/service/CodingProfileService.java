package com.careeros.coding.service;

import com.careeros.coding.client.CodingPlatformClient;
import com.careeros.coding.client.dto.PlatformStatsData;
import com.careeros.coding.dto.*;
import com.careeros.coding.entity.*;
import com.careeros.coding.model.Platform;
import com.careeros.coding.model.VerificationStatus;
import com.careeros.coding.repository.CodingAccountRepository;
import com.careeros.coding.repository.CodingStatsHistoryRepository;
import com.careeros.coding.repository.CodingStatsRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
public class CodingProfileService {

    private final CodingAccountRepository accountRepository;
    private final CodingStatsRepository statsRepository;
    private final CodingStatsHistoryRepository historyRepository;
    private final Map<Platform, CodingPlatformClient> clients;
    private final int expirationMinutes;
    private final SecureRandom secureRandom = new SecureRandom();

    public CodingProfileService(
            CodingAccountRepository accountRepository,
            CodingStatsRepository statsRepository,
            CodingStatsHistoryRepository historyRepository,
            List<CodingPlatformClient> clientList,
            @Value("${app.coding.verification-expiration-minutes:15}") int expirationMinutes) {
        this.accountRepository = accountRepository;
        this.statsRepository = statsRepository;
        this.historyRepository = historyRepository;
        this.expirationMinutes = expirationMinutes;
        this.clients = clientList.stream()
                .collect(Collectors.toMap(CodingPlatformClient::getPlatform, c -> c));
    }

    public ConnectAccountResponse connectAccount(Long userId, ConnectAccountRequest request) {
        if (userId == null) {
            throw new IllegalArgumentException("User is not authenticated");
        }
        if (request.getUsername() == null || request.getUsername().isBlank()) {
            throw new IllegalArgumentException("Username is required");
        }

        String username = request.getUsername().trim();
        Platform platform = request.getPlatform();

        CodingPlatformClient client = getClient(platform);
        if (client.getProfile(username).isEmpty()) {
            throw new IllegalArgumentException("LeetCode user '" + username + "' does not exist on the platform.");
        }

        Optional<CodingAccount> existingOpt = accountRepository.findByUserIdAndPlatform(userId, platform);
        CodingAccount account;

        String code = generateVerificationCode();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(expirationMinutes);

        if (existingOpt.isPresent()) {
            account = existingOpt.get();
            if (account.getVerificationStatus() == VerificationStatus.VERIFIED && account.getUsername().equalsIgnoreCase(username)) {
                throw new IllegalStateException("Your " + platform + " account ('" + username + "') is already connected and verified.");
            }
            // Update existing pending/reconnecting account
            account.setUsername(username);
            account.setVerificationCode(code);
            account.setVerificationStatus(VerificationStatus.PENDING);
            account.setVerificationExpiresAt(expiresAt);
            account.setVerifiedAt(null);
        } else {
            account = CodingAccount.builder()
                    .userId(userId)
                    .platform(platform)
                    .username(username)
                    .verificationCode(code)
                    .verificationStatus(VerificationStatus.PENDING)
                    .verificationExpiresAt(expiresAt)
                    .build();
        }

        account = accountRepository.save(account);

        String instructions = "Please paste the verification code '" + code + "' anywhere inside your LeetCode profile 'aboutMe' (Bio) section, then click 'Verify Ownership'.";

        return ConnectAccountResponse.builder()
                .accountId(account.getId())
                .platform(account.getPlatform())
                .username(account.getUsername())
                .verificationCode(code)
                .verificationStatus(account.getVerificationStatus())
                .verificationExpiresAt(account.getVerificationExpiresAt())
                .instructions(instructions)
                .build();
    }

    public CodingStatsResponse verifyOwnership(Long userId, Long accountId) {
        CodingAccount account = getAccountOwnedByUser(userId, accountId);

        if (account.getVerificationStatus() == VerificationStatus.VERIFIED) {
            return mapToStatsResponse(account, statsRepository.findByAccountId(account.getId()).orElse(null));
        }

        if (account.getVerificationExpiresAt() != null && account.getVerificationExpiresAt().isBefore(LocalDateTime.now())) {
            account.setVerificationStatus(VerificationStatus.FAILED);
            accountRepository.save(account);
            throw new IllegalStateException("Verification code has expired. Please reconnect your account to receive a new code.");
        }

        CodingPlatformClient client = getClient(account.getPlatform());
        boolean isVerified = client.verifyOwnership(account.getUsername(), account.getVerificationCode());

        if (!isVerified) {
            throw new IllegalArgumentException("Verification code was not found in @" + account.getUsername() + "'s LeetCode profile bio (aboutMe). Please update your bio on LeetCode and try again.");
        }

        account.setVerificationStatus(VerificationStatus.VERIFIED);
        account.setVerifiedAt(LocalDateTime.now());
        account.setVerificationCode(null); // Clear secret once verified
        accountRepository.save(account);

        log.info("Successfully verified {} account for user {} (@{})", account.getPlatform(), userId, account.getUsername());

        // Perform initial stats sync immediately
        return syncStats(userId, accountId);
    }

    public CodingStatsResponse syncStats(Long userId, Long accountId) {
        CodingAccount account = getAccountOwnedByUser(userId, accountId);

        if (account.getVerificationStatus() != VerificationStatus.VERIFIED) {
            throw new IllegalStateException("Cannot sync stats for an unverified account. Please complete ownership verification first.");
        }

        CodingPlatformClient client = getClient(account.getPlatform());
        Optional<PlatformStatsData> statsDataOpt = client.getStats(account.getUsername());

        if (statsDataOpt.isEmpty()) {
            throw new IllegalStateException("Failed to retrieve current stats from " + account.getPlatform() + " for user @" + account.getUsername());
        }

        PlatformStatsData data = statsDataOpt.get();

        CodingStats stats = statsRepository.findByAccountId(account.getId())
                .orElseGet(() -> CodingStats.builder().account(account).build());

        stats.setTotalSolved(data.getTotalSolved());
        stats.setEasySolved(data.getEasySolved());
        stats.setMediumSolved(data.getMediumSolved());
        stats.setHardSolved(data.getHardSolved());
        stats.setRating(data.getRating());
        stats.setCurrentStreak(data.getCurrentStreak());
        stats = statsRepository.save(stats);

        // Record history snapshot
        CodingStatsHistory history = CodingStatsHistory.builder()
                .account(account)
                .totalSolved(data.getTotalSolved())
                .easySolved(data.getEasySolved())
                .mediumSolved(data.getMediumSolved())
                .hardSolved(data.getHardSolved())
                .rating(data.getRating())
                .build();
        historyRepository.save(history);

        log.info("Synced stats for user {} (@{}): total={}, easy={}, medium={}, hard={}",
                userId, account.getUsername(), data.getTotalSolved(), data.getEasySolved(), data.getMediumSolved(), data.getHardSolved());

        return mapToStatsResponse(account, stats);
    }

    @Transactional(readOnly = true)
    public Map<String, CodingStatsResponse> getCurrentStats(Long userId) {
        List<CodingAccount> accounts = accountRepository.findByUserId(userId);
        Map<String, CodingStatsResponse> result = new LinkedHashMap<>();

        for (CodingAccount acc : accounts) {
            CodingStats stats = statsRepository.findByAccountId(acc.getId()).orElse(null);
            result.put(acc.getPlatform().name().toLowerCase(), mapToStatsResponse(acc, stats));
        }

        return result;
    }

    @Transactional(readOnly = true)
    public List<CodingStatsHistoryDTO> getStatsHistory(Long userId) {
        List<CodingStatsHistory> historyList = historyRepository.findByAccountUserIdOrderByRecordedAtAsc(userId);
        return historyList.stream()
                .map(h -> CodingStatsHistoryDTO.builder()
                        .id(h.getId())
                        .totalSolved(h.getTotalSolved())
                        .easy(h.getEasySolved())
                        .medium(h.getMediumSolved())
                        .hard(h.getHardSolved())
                        .rating(h.getRating())
                        .recordedAt(h.getRecordedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ConnectAccountResponse> getAccounts(Long userId) {
        return accountRepository.findByUserId(userId).stream()
                .map(acc -> ConnectAccountResponse.builder()
                        .accountId(acc.getId())
                        .platform(acc.getPlatform())
                        .username(acc.getUsername())
                        .verificationCode(acc.getVerificationCode())
                        .verificationStatus(acc.getVerificationStatus())
                        .verificationExpiresAt(acc.getVerificationExpiresAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DailyChallengeDTO> getDailyChallenges() {
        List<DailyChallengeDTO> challenges = new ArrayList<>();
        for (Platform platform : Platform.values()) {
            CodingPlatformClient client = clients.get(platform);
            if (client != null) {
                client.getDailyChallenge().ifPresent(challenges::add);
            }
        }
        return challenges;
    }

    public void disconnectAccount(Long userId, Long accountId) {
        CodingAccount account = getAccountOwnedByUser(userId, accountId);
        log.info("Disconnecting {} account for user {} (accountId={})", account.getPlatform(), userId, accountId);

        historyRepository.deleteByAccountId(accountId);
        statsRepository.deleteByAccountId(accountId);
        accountRepository.delete(account);
    }

    private CodingAccount getAccountOwnedByUser(Long userId, Long accountId) {
        if (userId == null || accountId == null) {
            throw new IllegalArgumentException("User ID and Account ID must not be null");
        }
        return accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Coding account not found or not owned by user."));
    }

    private CodingPlatformClient getClient(Platform platform) {
        CodingPlatformClient client = clients.get(platform);
        if (client == null) {
            throw new IllegalArgumentException("Platform '" + platform + "' is not supported yet.");
        }
        return client;
    }

    private String generateVerificationCode() {
        int randomInt = secureRandom.nextInt(0xFFFFFF);
        return String.format("CAREER-%06X", randomInt);
    }

    private CodingStatsResponse mapToStatsResponse(CodingAccount account, CodingStats stats) {
        return CodingStatsResponse.builder()
                .accountId(account.getId())
                .platform(account.getPlatform())
                .username(account.getUsername())
                .verificationStatus(account.getVerificationStatus())
                .totalSolved(stats != null ? stats.getTotalSolved() : 0)
                .easy(stats != null ? stats.getEasySolved() : 0)
                .medium(stats != null ? stats.getMediumSolved() : 0)
                .hard(stats != null ? stats.getHardSolved() : 0)
                .rating(stats != null ? stats.getRating() : null)
                .currentStreak(stats != null ? stats.getCurrentStreak() : null)
                .syncedAt(stats != null ? stats.getSyncedAt() : null)
                .verifiedAt(account.getVerifiedAt())
                .build();
    }
}
