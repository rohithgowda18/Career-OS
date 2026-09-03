import restClient from '../restClient';

export type Platform = 'LEETCODE' | 'CODEFORCES' | 'CODECHEF' | 'HACKERRANK' | 'GEEKSFORGEEKS';
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

export interface DailyActivityDTO {
  date: string; // YYYY-MM-DD
  totalSolved: number;
  breakdown: Record<string, number>;
}

export interface DailyChallengeDTO {
  platform: Platform;
  platformName: string;
  title: string;
  problemUrl: string;
  difficulty?: string;
  date?: string;
  available: boolean;
  note?: string;
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

  getDailyActivities: async (year?: number, platform?: Platform): Promise<DailyActivityDTO[]> => {
    const params: Record<string, any> = {};
    if (year) params.year = year;
    if (platform) params.platform = platform;
    const res = await restClient.get('/api/coding/activity', { params });
    return res.data;
  },

  getAccounts: async (): Promise<ConnectAccountResponse[]> => {
    const res = await restClient.get('/api/coding/accounts');
    return res.data;
  },

  getDailyChallenges: async (): Promise<DailyChallengeDTO[]> => {
    const res = await restClient.get('/api/coding/daily');
    return res.data;
  },

  disconnectAccount: async (accountId: number): Promise<void> => {
    await restClient.delete(`/api/coding/accounts/${accountId}`);
  },
};
