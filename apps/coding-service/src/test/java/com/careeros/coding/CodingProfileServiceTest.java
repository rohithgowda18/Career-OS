package com.careeros.coding;

import com.careeros.coding.client.CodingPlatformClient;
import com.careeros.coding.client.dto.PlatformProfileData;
import com.careeros.coding.client.dto.PlatformStatsData;
import com.careeros.coding.dto.CodingStatsResponse;
import com.careeros.coding.dto.ConnectAccountRequest;
import com.careeros.coding.dto.ConnectAccountResponse;
import com.careeros.coding.dto.DailyChallengeDTO;
import com.careeros.coding.entity.*;
import com.careeros.coding.model.Platform;
import com.careeros.coding.model.VerificationStatus;
import com.careeros.coding.repository.CodingAccountRepository;
import com.careeros.coding.repository.CodingStatsHistoryRepository;
import com.careeros.coding.repository.CodingStatsRepository;
import com.careeros.coding.service.CodingProfileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CodingProfileServiceTest {

    @Mock
    private CodingAccountRepository accountRepository;

    @Mock
    private CodingStatsRepository statsRepository;

    @Mock
    private CodingStatsHistoryRepository historyRepository;

    @Mock
    private CodingPlatformClient leetCodeClient;

    @Mock
    private CodingPlatformClient codeforcesClient;

    @Mock
    private CodingPlatformClient codeChefClient;

    @Mock
    private CodingPlatformClient hackerRankClient;

    @Mock
    private CodingPlatformClient geeksForGeeksClient;

    private CodingProfileService service;

    @BeforeEach
    void setUp() {
        when(leetCodeClient.getPlatform()).thenReturn(Platform.LEETCODE);
        when(codeforcesClient.getPlatform()).thenReturn(Platform.CODEFORCES);
        when(codeChefClient.getPlatform()).thenReturn(Platform.CODECHEF);
        when(hackerRankClient.getPlatform()).thenReturn(Platform.HACKERRANK);
        when(geeksForGeeksClient.getPlatform()).thenReturn(Platform.GEEKSFORGEEKS);

        service = new CodingProfileService(
                accountRepository,
                statsRepository,
                historyRepository,
                List.of(leetCodeClient, codeforcesClient, codeChefClient, hackerRankClient, geeksForGeeksClient),
                15
        );
    }

    @Test
    void testConnectAccount_LeetCode_Success() {
        ConnectAccountRequest request = ConnectAccountRequest.builder()
                .platform(Platform.LEETCODE)
                .username("testcoder")
                .build();

        when(leetCodeClient.getProfile("testcoder"))
                .thenReturn(Optional.of(PlatformProfileData.builder().username("testcoder").exists(true).build()));
        when(accountRepository.findByUserIdAndPlatform(1L, Platform.LEETCODE)).thenReturn(Optional.empty());
        when(accountRepository.save(any(CodingAccount.class))).thenAnswer(i -> {
            CodingAccount acc = i.getArgument(0);
            acc.setId(10L);
            return acc;
        });

        ConnectAccountResponse response = service.connectAccount(1L, request);

        assertNotNull(response);
        assertEquals(10L, response.getAccountId());
        assertEquals("testcoder", response.getUsername());
        assertEquals(Platform.LEETCODE, response.getPlatform());
        assertEquals(VerificationStatus.PENDING, response.getVerificationStatus());
        assertTrue(response.getVerificationCode().startsWith("CAREER-"));
        assertTrue(response.getVerificationExpiresAt().isAfter(LocalDateTime.now()));
    }

    @Test
    void testConnectAccount_Codeforces_Success() {
        ConnectAccountRequest request = ConnectAccountRequest.builder()
                .platform(Platform.CODEFORCES)
                .username("tourist")
                .build();

        when(codeforcesClient.getProfile("tourist"))
                .thenReturn(Optional.of(PlatformProfileData.builder().username("tourist").exists(true).build()));
        when(accountRepository.findByUserIdAndPlatform(1L, Platform.CODEFORCES)).thenReturn(Optional.empty());
        when(accountRepository.save(any(CodingAccount.class))).thenAnswer(i -> {
            CodingAccount acc = i.getArgument(0);
            acc.setId(20L);
            return acc;
        });

        ConnectAccountResponse response = service.connectAccount(1L, request);

        assertNotNull(response);
        assertEquals(20L, response.getAccountId());
        assertEquals("tourist", response.getUsername());
        assertEquals(Platform.CODEFORCES, response.getPlatform());
    }

    @Test
    void testVerifyOwnership_Success_ClearsCodeAndSyncs() {
        CodingAccount account = CodingAccount.builder()
                .id(10L)
                .userId(1L)
                .platform(Platform.LEETCODE)
                .username("testcoder")
                .verificationCode("CAREER-123456")
                .verificationStatus(VerificationStatus.PENDING)
                .verificationExpiresAt(LocalDateTime.now().plusMinutes(10))
                .build();

        when(accountRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(account));
        when(leetCodeClient.verifyOwnership("testcoder", "CAREER-123456")).thenReturn(true);
        when(leetCodeClient.getStats("testcoder")).thenReturn(Optional.of(PlatformStatsData.builder()
                .username("testcoder")
                .totalSolved(150)
                .easySolved(50)
                .mediumSolved(80)
                .hardSolved(20)
                .rating(1850.5)
                .build()));

        when(statsRepository.findByAccountId(10L)).thenReturn(Optional.empty());
        when(statsRepository.save(any(CodingStats.class))).thenAnswer(i -> i.getArgument(0));

        CodingStatsResponse response = service.verifyOwnership(1L, 10L);

        assertNotNull(response);
        assertEquals(VerificationStatus.VERIFIED, response.getVerificationStatus());
        assertEquals(150, response.getTotalSolved());
        assertEquals(50, response.getEasy());
        assertEquals(80, response.getMedium());
        assertEquals(20, response.getHard());
        assertEquals(1850.5, response.getRating());

        assertNull(account.getVerificationCode());
        verify(historyRepository, times(1)).save(any(CodingStatsHistory.class));
    }

    @Test
    void testVerifyOwnership_CodeMissing_Throws() {
        CodingAccount account = CodingAccount.builder()
                .id(10L)
                .userId(1L)
                .platform(Platform.LEETCODE)
                .username("testcoder")
                .verificationCode("CAREER-123456")
                .verificationStatus(VerificationStatus.PENDING)
                .verificationExpiresAt(LocalDateTime.now().plusMinutes(10))
                .build();

        when(accountRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(account));
        when(leetCodeClient.verifyOwnership("testcoder", "CAREER-123456")).thenReturn(false);

        assertThrows(IllegalArgumentException.class, () -> service.verifyOwnership(1L, 10L));
    }

    @Test
    void testVerifyOwnership_CodeExpired_Throws() {
        CodingAccount account = CodingAccount.builder()
                .id(10L)
                .userId(1L)
                .platform(Platform.LEETCODE)
                .username("testcoder")
                .verificationCode("CAREER-123456")
                .verificationStatus(VerificationStatus.PENDING)
                .verificationExpiresAt(LocalDateTime.now().minusMinutes(1))
                .build();

        when(accountRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(account));

        assertThrows(IllegalStateException.class, () -> service.verifyOwnership(1L, 10L));
        assertEquals(VerificationStatus.FAILED, account.getVerificationStatus());
    }

    @Test
    void testGetCurrentStats_MultiPlatform() {
        CodingAccount acc1 = CodingAccount.builder().id(1L).userId(1L).platform(Platform.LEETCODE).username("lc_user").verificationStatus(VerificationStatus.VERIFIED).build();
        CodingAccount acc2 = CodingAccount.builder().id(2L).userId(1L).platform(Platform.CODEFORCES).username("cf_user").verificationStatus(VerificationStatus.VERIFIED).build();

        CodingStats stats1 = CodingStats.builder().id(1L).account(acc1).totalSolved(462).rating(1669.0).build();
        CodingStats stats2 = CodingStats.builder().id(2L).account(acc2).totalSolved(183).rating(1421.0).build();

        when(accountRepository.findByUserId(1L)).thenReturn(List.of(acc1, acc2));
        when(statsRepository.findByAccountId(1L)).thenReturn(Optional.of(stats1));
        when(statsRepository.findByAccountId(2L)).thenReturn(Optional.of(stats2));

        Map<String, CodingStatsResponse> map = service.getCurrentStats(1L);

        assertEquals(2, map.size());
        assertEquals(462, map.get("leetcode").getTotalSolved());
        assertEquals(183, map.get("codeforces").getTotalSolved());
    }

    @Test
    void testGetDailyChallenges_AggregatesAvailablePlatforms() {
        DailyChallengeDTO lcChallenge = DailyChallengeDTO.builder()
                .platform(Platform.LEETCODE)
                .platformName("LeetCode")
                .title("Two Sum")
                .problemUrl("https://leetcode.com/problems/two-sum")
                .available(true)
                .date(LocalDate.now())
                .build();

        DailyChallengeDTO cfChallenge = DailyChallengeDTO.builder()
                .platform(Platform.CODEFORCES)
                .platformName("Codeforces")
                .title("Problemset")
                .problemUrl("https://codeforces.com/problemset")
                .available(true)
                .date(LocalDate.now())
                .build();

        when(leetCodeClient.getDailyChallenge()).thenReturn(Optional.of(lcChallenge));
        when(codeforcesClient.getDailyChallenge()).thenReturn(Optional.of(cfChallenge));
        when(codeChefClient.getDailyChallenge()).thenReturn(Optional.empty());
        when(hackerRankClient.getDailyChallenge()).thenReturn(Optional.empty());
        when(geeksForGeeksClient.getDailyChallenge()).thenReturn(Optional.empty());

        List<DailyChallengeDTO> challenges = service.getDailyChallenges();

        assertEquals(2, challenges.size());
        assertEquals("LeetCode", challenges.get(0).getPlatformName());
        assertEquals("Codeforces", challenges.get(1).getPlatformName());
    }

    @Test
    void testDisconnectAccount_Success() {
        CodingAccount account = CodingAccount.builder()
                .id(10L)
                .userId(1L)
                .platform(Platform.LEETCODE)
                .username("testcoder")
                .build();

        when(accountRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(account));

        service.disconnectAccount(1L, 10L);

        verify(historyRepository, times(1)).deleteByAccountId(10L);
        verify(statsRepository, times(1)).deleteByAccountId(10L);
        verify(accountRepository, times(1)).delete(account);
    }

    @Test
    void testGetActivitySummary_AggregatesPlatformsAndStreaks() {
        CodingAccount acc1 = CodingAccount.builder().id(1L).userId(1L).platform(Platform.LEETCODE).username("lc_user").verificationStatus(VerificationStatus.VERIFIED).build();
        CodingAccount acc2 = CodingAccount.builder().id(2L).userId(1L).platform(Platform.CODEFORCES).username("cf_user").verificationStatus(VerificationStatus.VERIFIED).build();

        when(accountRepository.findByUserId(1L)).thenReturn(List.of(acc1, acc2));

        LocalDate d1 = LocalDate.of(2026, 9, 1);
        LocalDate d2 = LocalDate.of(2026, 9, 2);

        when(leetCodeClient.getDailyActivity("lc_user", 2026)).thenReturn(Map.of(d1, 3, d2, 2));
        when(codeforcesClient.getDailyActivity("cf_user", 2026)).thenReturn(Map.of(d1, 2, d2, 1));

        com.careeros.coding.dto.ActivitySummaryDTO summary = service.getActivitySummary(1L, 2026, null);

        assertEquals(2026, summary.getYear());
        assertEquals(8, summary.getTotalSolvedInYear()); // (3+2) + (2+1)
        assertEquals(2, summary.getTotalActiveDays());
        assertEquals(2, summary.getMaxStreak());
        assertEquals(2, summary.getDailyActivities().size());
        assertEquals(5, summary.getDailyActivities().get(0).getTotalSolved()); // Day 1: 3 + 2
    }
}
