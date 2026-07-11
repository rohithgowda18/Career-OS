import { useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/api/authApi";

import { removeTokenFromIndexedDB } from "@/lib/restClient";

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logout = useCallback(async () => {
    localStorage.removeItem("token");
    const secureFlag = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; secure' : '';
    document.cookie = `token=; max-age=0; path=/; samesite=lax${secureFlag}`;
    await removeTokenFromIndexedDB();
    queryClient.clear();
    setLocation("/login");
  }, [queryClient, setLocation]);

  const state = useMemo(() => {
    return {
      user: meQuery.data ?? null,
      loading: meQuery.isLoading,
      error: meQuery.error ?? null,
      isAuthenticated: !!meQuery.data,
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
