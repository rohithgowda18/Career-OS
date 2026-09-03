package com.careeros.coding;

import com.careeros.coding.client.CodingPlatformClient;
import com.careeros.coding.client.dto.PlatformProfileData;
import com.careeros.coding.client.dto.PlatformStatsData;
import com.careeros.coding.dto.CodingStatsResponse;
import com.careeros.coding.dto.ConnectAccountRequest;
import com.careeros.coding.dto.ConnectAccountResponse;
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

import java.time.LocalDateTime;
import java.util.List;
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

    private CodingProfileService service;

    @BeforeEach
    void setUp() {
        when(leetCodeClient.getPlatform()).thenReturn(Platform.LEETCODE);
        service = new CodingProfileService(accountRepository, statsRepository, historyRepository, List.of(leetCodeClient), 15);
    }

    @Test
    void testConnectAccount_Success() {
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
    void testConnectAccount_DuplicateVerifiedAccount_Throws() {
        ConnectAccountRequest request = ConnectAccountRequest.builder()
                .platform(Platform.LEETCODE)
                .username("testcoder")
                .build();

        CodingAccount existing = CodingAccount.builder()
                .id(10L)
                .userId(1L)
                .platform(Platform.LEETCODE)
                .username("testcoder")
                .verificationStatus(VerificationStatus.VERIFIED)
                .build();

        when(leetCodeClient.getProfile("testcoder"))
                .thenReturn(Optional.of(PlatformProfileData.builder().username("testcoder").exists(true).build()));
        when(accountRepository.findByUserIdAndPlatform(1L, Platform.LEETCODE)).thenReturn(Optional.of(existing));

        assertThrows(IllegalStateException.class, () -> service.connectAccount(1L, request));
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

        // Verification code must be cleared
        assertNull(account.getVerificationCode());

        // Verify history record was created
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
    void testUserIsolation_UnauthorizedAccess_Throws() {
        when(accountRepository.findByIdAndUserId(10L, 2L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> service.syncStats(2L, 10L));
        assertThrows(IllegalArgumentException.class, () -> service.disconnectAccount(2L, 10L));
        assertThrows(IllegalArgumentException.class, () -> service.verifyOwnership(2L, 10L));
    }

    @Test
    void testSyncStats_UnverifiedAccount_Throws() {
        CodingAccount account = CodingAccount.builder()
                .id(10L)
                .userId(1L)
                .platform(Platform.LEETCODE)
                .username("testcoder")
                .verificationStatus(VerificationStatus.PENDING)
                .build();

        when(accountRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(account));

        assertThrows(IllegalStateException.class, () -> service.syncStats(1L, 10L));
    }

    @Test
    void testSyncStats_VerifiedAccount_Success_CreatesHistory() {
        CodingAccount account = CodingAccount.builder()
                .id(10L)
                .userId(1L)
                .platform(Platform.LEETCODE)
                .username("testcoder")
                .verificationStatus(VerificationStatus.VERIFIED)
                .build();

        when(accountRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(account));
        when(leetCodeClient.getStats("testcoder")).thenReturn(Optional.of(PlatformStatsData.builder()
                .username("testcoder")
                .totalSolved(200)
                .easySolved(70)
                .mediumSolved(100)
                .hardSolved(30)
                .build()));

        when(statsRepository.findByAccountId(10L)).thenReturn(Optional.empty());
        when(statsRepository.save(any(CodingStats.class))).thenAnswer(i -> i.getArgument(0));

        CodingStatsResponse response = service.syncStats(1L, 10L);

        assertNotNull(response);
        assertEquals(200, response.getTotalSolved());
        assertEquals(70, response.getEasy());
        verify(historyRepository, times(1)).save(any(CodingStatsHistory.class));
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
}
