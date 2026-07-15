import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/api/authApi";

interface AuthContextType {
  user: any;
  loading: boolean;
  error: any;
  isAuthenticated: boolean;
  logout: () => void;
  refresh: () => void;
  setToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [token, setTokenState] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const foundToken = localStorage.getItem("token");
      console.log("[Debug Auth] AuthProvider constructor - token found in localStorage:", foundToken ? "YES" : "NO");
      return foundToken;
    }
    return null;
  });

  const [isInitializing, setIsInitializing] = useState(true);

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    enabled: !!token,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    console.log(`[Debug Auth] AuthProvider useEffect initialization check - token: ${token ? "YES" : "NO"}, queryState: ${meQuery.status}, isSuccess: ${meQuery.isSuccess}, isError: ${meQuery.isError}`);
    if (!token) {
      console.log("[Debug Auth] No token state present. Setting isInitializing to false.");
      setIsInitializing(false);
    } else if (meQuery.isSuccess || meQuery.isError) {
      console.log(`[Debug Auth] meQuery finished. Success: ${meQuery.isSuccess}, Error: ${meQuery.isError}. Setting isInitializing to false.`);
      setIsInitializing(false);
    }
  }, [token, meQuery.isSuccess, meQuery.isError, meQuery.status]);


  const setToken = useCallback((newToken: string | null) => {
    console.log("[Debug Auth] setToken called - new token present:", newToken ? "YES" : "NO");
    if (newToken) {
      localStorage.setItem("token", newToken);
    } else {
      localStorage.removeItem("token");
    }
    setTokenState(newToken);
  }, []);

  const logout = useCallback(() => {
    console.log("[Debug Auth] logout called - clearing state");
    localStorage.removeItem("token");
    setTokenState(null);
    queryClient.clear();
    setLocation("/login");
  }, [queryClient, setLocation]);

  const value = useMemo(() => ({
    user: meQuery.data ?? null,
    loading: isInitializing,
    error: meQuery.error ?? null,
    isAuthenticated: !!meQuery.data,
    logout,
    refresh: () => meQuery.refetch(),
    setToken,
  }), [meQuery.data, isInitializing, meQuery.error, logout, setToken]);

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
