/**
 * useFetchMetadata Hook
 * Safely fetches event metadata with loading and error state management
 */

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { applicationsApi } from '@/lib/api/applicationsApi';

export interface FetchMetadataState {
  isLoading: boolean;
  error: string | null;
  data: {
    title?: string;
    description?: string;
    image?: string;
    eventType?: 'Hackathon' | 'Workshop' | 'Conference' | 'Other';
  } | null;
}

export interface UseFetchMetadataReturn extends FetchMetadataState {
  fetchMetadata: (url: string) => Promise<void>;
  reset: () => void;
}

/**
 * Hook to fetch event metadata from URL
 * @returns Object with fetch function and state
 */
export function useFetchMetadata(): UseFetchMetadataReturn {
  const [state, setState] = useState<FetchMetadataState>({
    isLoading: false,
    error: null,
    data: null,
  });

  // Use tRPC mutation for fetching metadata
  const fetchMetadataMutation = useMutation({ mutationFn: applicationsApi.fetchMetadata });

  const fetchMetadata = useCallback(
    async (url: string) => {
      // Reset previous state
      setState({
        isLoading: true,
        error: null,
        data: null,
      });

      try {
        // Basic URL format validation
        if (!url || url.trim().length === 0) {
          setState({
            isLoading: false,
            error: 'Please enter a valid URL',
            data: null,
          });
          return;
        }

        // Normalize URL if needed
        let normalizedUrl = url.trim();
        if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
          normalizedUrl = `https://${normalizedUrl}`;
        }

        // Call the API
        const result = await fetchMetadataMutation.mutateAsync({
          url: normalizedUrl,
        });

        if (result.success && result.data) {
          setState({
            isLoading: false,
            error: null,
            data: result.data,
          });
        } else {
          setState({
            isLoading: false,
            error: result.error || 'Failed to fetch metadata',
            data: null,
          });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch metadata';
        setState({
          isLoading: false,
          error: errorMessage,
          data: null,
        });
      }
    },
    [fetchMetadataMutation]
  );

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      data: null,
    });
  }, []);

  return {
    ...state,
    fetchMetadata,
    reset,
  };
}
