import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import restClient from './restClient';

// Helper to handle REST calls
const apiCall = async (method: string, url: string, data?: any) => {
  const response = await (restClient as any)[method.toLowerCase()](url, data);
  return response.data;
};

/**
 * A simplified REST-based proxy that mimics tRPC syntax.
 * This allows the UI components to remain largely unchanged.
 */
export const trpc: any = {
  useUtils: () => {
    const queryClient = useQueryClient();
    return {
      invalidate: () => queryClient.invalidateQueries(),
      auth: {
        me: {
          invalidate: () => queryClient.invalidateQueries({ queryKey: ['auth', 'me'] }),
          setData: (input: any, updater: any) => queryClient.setQueryData(['auth', 'me'], updater),
        }
      },
      applications: {
        list: {
          invalidate: () => queryClient.invalidateQueries({ queryKey: ['applications', 'list'] }),
        }
      },
      profile: {
        invalidate: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
      }
    };
  },
  
  auth: {
    me: {
      useQuery: (input: any, options: any) => useQuery({
        queryKey: ['auth', 'me'],
        queryFn: () => apiCall('GET', '/auth/me'),
        ...options,
      }),
    },
    login: {
      useMutation: (options: any) => useMutation({
        ...options,
        mutationFn: (data: any) => apiCall('POST', '/auth/login', data),
        onSuccess: (data, variables, context) => {
          if (data.token) localStorage.setItem('token', data.token);
          if (options?.onSuccess) options.onSuccess(data, variables, context);
        },
      }),
    },
    register: {
      useMutation: (options: any) => useMutation({
        ...options,
        mutationFn: (data: any) => apiCall('POST', '/auth/register', data),
        onSuccess: (data, variables, context) => {
          if (data.token) localStorage.setItem('token', data.token);
          if (options?.onSuccess) options.onSuccess(data, variables, context);
        },
      }),
    },
  },

  applications: {
    list: {
      useQuery: (input: any, options: any) => useQuery({
        queryKey: ['applications', 'list'],
        queryFn: () => apiCall('GET', '/applications'),
        ...options,
      }),
    },
    fetchMetadata: {
      useMutation: (options: any) => useMutation({
        mutationFn: (data: any) => apiCall('POST', '/applications/fetch-metadata', data),
        ...options,
      }),
    },
    create: {
      useMutation: (options: any) => useMutation({
        mutationFn: (data: any) => apiCall('POST', '/applications', data),
        ...options,
      }),
    },
    update: {
      useMutation: (options: any) => useMutation({
        mutationFn: (data: any) => apiCall('PUT', `/applications/${data.id}`, data),
        ...options,
      }),
    },
    delete: {
      useMutation: (options: any) => useMutation({
        mutationFn: (id: any) => apiCall('DELETE', `/applications/${id}`),
        ...options,
      }),
    },
  },

  preferences: {
    get: {
      useQuery: (input: any, options: any) => useQuery({
        queryKey: ['preferences'],
        queryFn: () => apiCall('GET', '/preferences'),
        ...options,
      }),
    },
    update: {
      useMutation: (options: any) => useMutation({
        mutationFn: (data: any) => apiCall('PUT', '/preferences', data),
        ...options,
      }),
    },
  },

  recommendations: {
    generate: {
      useQuery: (input: any, options: any) => useQuery({
        queryKey: ['recommendations'],
        queryFn: () => apiCall('GET', '/recommendations/generate'),
        ...options,
      }),
    },
  },

  analytics: {
    summary: {
      useQuery: (input: any, options: any) => useQuery({
        queryKey: ['analytics', 'summary'],
        queryFn: () => apiCall('GET', '/analytics/summary'),
        ...options,
      }),
    },
    acceptanceRates: {
      useQuery: (input: any, options: any) => useQuery({
        queryKey: ['analytics', 'acceptanceRates'],
        queryFn: () => apiCall('GET', '/analytics/rates'),
        ...options,
      }),
    },
    seasonalTrends: {
      useQuery: (input: any, options: any) => useQuery({
        queryKey: ['analytics', 'seasonalTrends'],
        queryFn: () => apiCall('GET', '/analytics/trends'),
        ...options,
      }),
    },
    statusDistribution: {
      useQuery: (input: any, options: any) => useQuery({
        queryKey: ['analytics', 'statusDistribution'],
        queryFn: () => apiCall('GET', '/analytics/distribution'),
        ...options,
      }),
    },
  },
  
  profile: {
    me: {
      useQuery: (input: any, options: any) => useQuery({
        queryKey: ['profile', 'me'],
        queryFn: () => apiCall('GET', '/profile/me'),
        ...options,
      }),
    },
    getByUsername: {
      useQuery: (username: string, options: any) => useQuery({
        queryKey: ['profile', username],
        queryFn: () => apiCall('GET', `/profile/public/${username}`),
        ...options,
      }),
    },
    getStats: {
      useQuery: (username: string, options: any) => useQuery({
        queryKey: ['profile', username, 'stats'],
        queryFn: () => apiCall('GET', `/profile/public/${username}/stats`),
        ...options,
      }),
    },
  },

  applicationProfile: {
    get: {
      useQuery: (input: any, options: any) => useQuery({
        queryKey: ['applicationProfile'],
        queryFn: () => apiCall('GET', '/profile/me'), 
        ...options,
      }),
    },
    upsert: {
      useMutation: (options: any) => useMutation({
        mutationFn: (data: any) => apiCall('PUT', '/recommendations/profile', data),
        ...options,
      }),
    },
  },
  
  calendar: {
    getConflicts: {
      useQuery: (input: any, options: any) => useQuery({
        queryKey: ['calendar', 'conflicts'],
        queryFn: () => apiCall('GET', '/calendar/conflicts'),
        ...options,
      }),
    },
  },

  teams: {
    list: {
      useQuery: (input: any, options: any) => useQuery({
        queryKey: ['teams', 'list'],
        queryFn: () => apiCall('GET', '/teams'),
        ...options,
      }),
    },
  },

  successScoring: {
    getScore: {
      useQuery: (appId: any, options: any) => useQuery({
        queryKey: ['successScoring', appId],
        queryFn: () => apiCall('GET', `/success-scoring/${appId}`),
        ...options,
      }),
    },
  },
};

