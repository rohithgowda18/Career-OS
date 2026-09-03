import restClient from '../restClient';

export type Platform = 'LEETCODE';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'FAILED';

export interface ConnectAccountRequest {
  platform: Platform;
  username: string;
}

export interface ConnectAccountResponse {
  accountId: number;
  platform: Platform;
  username: string;
  verificationCode?: string;
  verificationStatus: VerificationStatus;
  verificationExpiresAt?: string;
  instructions?: string;
}

export interface CodingStatsResponse {
  accountId: number;
  platform: Platform;
  username: string;
  verificationStatus: VerificationStatus;
  totalSolved: number;
  easy: number;
  medium: number;
  hard: number;
  rating?: number;
  currentStreak?: number;
  syncedAt?: string;
  verifiedAt?: string;
}

export interface CodingStatsHistoryDTO {
  id: number;
  totalSolved: number;
  easy: number;
  medium: number;
  hard: number;
  rating?: number;
  recordedAt: string;
}

export const codingApi = {
  connectAccount: async (data: ConnectAccountRequest): Promise<ConnectAccountResponse> => {
    const res = await restClient.post('/api/coding/accounts', data);
    return res.data;
  },

  verifyOwnership: async (accountId: number): Promise<CodingStatsResponse> => {
    const res = await restClient.post(`/api/coding/accounts/${accountId}/verify`);
    return res.data;
  },

  syncStats: async (accountId: number): Promise<CodingStatsResponse> => {
    const res = await restClient.post(`/api/coding/accounts/${accountId}/sync`);
    return res.data;
  },

  getCurrentStats: async (): Promise<Record<string, CodingStatsResponse>> => {
    const res = await restClient.get('/api/coding/stats');
    return res.data;
  },

  getStatsHistory: async (): Promise<CodingStatsHistoryDTO[]> => {
    const res = await restClient.get('/api/coding/stats/history');
    return res.data;
  },

  getAccounts: async (): Promise<ConnectAccountResponse[]> => {
    const res = await restClient.get('/api/coding/accounts');
    return res.data;
  },

  disconnectAccount: async (accountId: number): Promise<void> => {
    await restClient.delete(`/api/coding/accounts/${accountId}`);
  },
};
