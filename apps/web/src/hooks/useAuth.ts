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
  isWakingTimeout: boolean;
  retryReadiness: () => void;
  isAuthTransientError: boolean;
  retryAuth: () => void;
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
  const [isWakingTimeout, setIsWakingTimeout] = useState(false);
  const [pollTrigger, setPollTrigger] = useState(0);

  const retryReadiness = useCallback(() => {
    console.log("[Debug Auth] Resetting readiness polling loop...");
    setIsWakingTimeout(false);
    setReadinessMessage("Preparing your workspace...");
    setPollTrigger(prev => prev + 1);
  }, []);

  // Centralized background backend readiness checking with fixed 3s retry polling and strict lifecycle aborts
  useEffect(() => {
    let active = true;
    let timeoutId: any;
    let inFlight = false;
    const startTime = Date.now();
    const abortController = new AbortController();

    const checkReadiness = async () => {
      if (!active || inFlight) return;
      inFlight = true;

      try {
        await axios.get(`${BACKEND_URL}/actuator/health`, { 
          timeout: 15000,
          signal: abortController.signal
        });
        if (active) {
          console.log("[Debug Auth] Backend is ready and healthy.");
          if (typeof window !== "undefined") {
            (window as any).__backendReadyFlag = true;
          }
          setIsBackendReady(true);
        }
      } catch (err) {
        inFlight = false;
        if (!active) return;
        if (axios.isCancel(err)) {
          console.log("[Debug Auth] Readiness check fetch request cancelled via cleanup.");
          return;
        }

        const elapsed = Date.now() - startTime;
        if (elapsed > 100000) {
          console.log("[Debug Auth] Backend readiness check timed out after 100s.");
          setIsWakingTimeout(true);
          setReadinessMessage("The server is taking longer than expected to wake up. Please check your connection and try again.");
          return;
        }

        if (elapsed > 10000) {
          setReadinessMessage("Server is waking up. This may take a moment on the first load...");
        }
        
        // Fixed short retry gap (3s) to eliminate detection gaps without exponential delay accumulation
        timeoutId = setTimeout(checkReadiness, 3000);
      }
    };

    checkReadiness();

    return () => {
      active = false;
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [pollTrigger]);

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    enabled: !!token && isBackendReady,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const isAuthTransientError = useMemo(() => {
    if (!meQuery.isError) return false;
    const status = (meQuery.error as any)?.response?.status;
    return !status || status >= 500;
  }, [meQuery.isError, meQuery.error]);

  const retryAuth = useCallback(() => {
    console.log("[Debug Auth] Retrying user profile authentication...");
    meQuery.refetch();
  }, [meQuery]);

  useEffect(() => {
    console.log(`[Debug Auth] AuthProvider useEffect initialization check - token: ${token ? "YES" : "NO"}, backendReady: ${isBackendReady}, queryState: ${meQuery.status}, transientError: ${isAuthTransientError}`);
    if (!token) {
      console.log("[Debug Auth] No token state present. Setting isInitializing to false.");
      setIsInitializing(false);
    } else if (isBackendReady) {
      if (meQuery.isSuccess) {
        console.log("[Debug Auth] meQuery finished successfully. Setting isInitializing to false.");
        setIsInitializing(false);
      } else if (meQuery.isError) {
        if (isAuthTransientError) {
          console.log("[Debug Auth] meQuery finished with a transient error. Keeping loading state for manual retry.");
        } else {
          console.log("[Debug Auth] meQuery finished with a permanent authentication error (401/403). Clearing session.");
          localStorage.removeItem("token");
          setTokenState(null);
          setIsInitializing(false);
        }
      }
    }
  }, [token, isBackendReady, meQuery.isSuccess, meQuery.isError, isAuthTransientError]);

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
    isWakingTimeout,
    retryReadiness,
    isAuthTransientError,
    retryAuth,
  }), [
    meQuery.data,
    isInitializing,
    meQuery.error,
    logout,
    setToken,
    isBackendReady,
    readinessMessage,
    isWakingTimeout,
    retryReadiness,
    isAuthTransientError,
    retryAuth
  ]);

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
