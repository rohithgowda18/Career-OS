import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/api/authApi";
import axios from "axios";
import { BACKEND_URL } from "@/lib/restClient";

interface AuthContextType {
  user: any;
  loading: boolean;
  error: any;
  isAuthenticated: boolean;
  logout: () => void;
  refresh: () => void;
  setToken: (token: string | null) => void;
  isBackendReady: boolean;
  readinessMessage: string;
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

  const [isBackendReady, setIsBackendReady] = useState(false);
  const [readinessMessage, setReadinessMessage] = useState("Preparing your workspace...");
  const [isInitializing, setIsInitializing] = useState(true);

  // Centralized background backend readiness checking with exponential backoff polling
  useEffect(() => {
    let active = true;
    let timeoutId: any;
    const startTime = Date.now();

    const checkReadiness = async (delay = 2000) => {
      try {
        await axios.get(`${BACKEND_URL}/actuator/health`, { timeout: 8000 });
        if (active) {
          console.log("[Debug Auth] Backend is ready and healthy.");
          if (typeof window !== "undefined") {
            (window as any).__backendReadyFlag = true;
          }
          setIsBackendReady(true);
        }
      } catch (err) {
        if (!active) return;
        const elapsed = Date.now() - startTime;
        if (elapsed > 10000) {
          setReadinessMessage("Server is waking up. This may take a moment on the first load...");
        }
        // Exponential backoff up to 10 seconds max delay
        const nextDelay = Math.min(delay * 1.5, 10000);
        timeoutId = setTimeout(() => checkReadiness(nextDelay), delay);
      }
    };

    checkReadiness();

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    enabled: !!token && isBackendReady,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    console.log(`[Debug Auth] AuthProvider useEffect initialization check - token: ${token ? "YES" : "NO"}, backendReady: ${isBackendReady}, queryState: ${meQuery.status}`);
    if (!token) {
      console.log("[Debug Auth] No token state present. Setting isInitializing to false.");
      setIsInitializing(false);
    } else if (isBackendReady && (meQuery.isSuccess || meQuery.isError)) {
      console.log(`[Debug Auth] meQuery finished. Success: ${meQuery.isSuccess}, Error: ${meQuery.isError}. Setting isInitializing to false.`);
      setIsInitializing(false);
    }
  }, [token, isBackendReady, meQuery.isSuccess, meQuery.isError]);

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
    isBackendReady,
    readinessMessage,
  }), [meQuery.data, isInitializing, meQuery.error, logout, setToken, isBackendReady, readinessMessage]);

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
