import React, { Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { BACKEND_URL } from "@/lib/restClient";

// Lazy load route pages to improve load performance
const LandingPage = React.lazy(() => import("./pages/LandingPage"));
const LoginPage = React.lazy(() => import("./pages/LoginPage"));
const OAuthSuccessPage = React.lazy(() => import("./pages/OAuthSuccessPage"));
const Home = React.lazy(() => import("./pages/Home"));
const PlacementsPage = React.lazy(() => import("./pages/PlacementsPage"));
const AddEventPage = React.lazy(() => import("./pages/AddEventPage"));
const PrivacyPage = React.lazy(() => import("./pages/PrivacyPage"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

function Router() {
  const { 
    isAuthenticated, 
    loading, 
    isBackendReady, 
    readinessMessage, 
    isWakingTimeout, 
    retryReadiness, 
    isAuthTransientError, 
    retryAuth 
  } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    console.log(`[Debug Auth] Router Route Guard - path: "${location}", token in localStorage: ${token ? "YES" : "NO"}, auth loading: ${loading}, isAuthenticated: ${isAuthenticated}`);
    
    if (loading) {
      console.log("[Debug Auth] Route Guard - Auth is initializing, holding navigation decisions.");
      return;
    }

    if (isAuthenticated) {
      if (location === "/" || location === "/login") {
        console.log(`[Debug Auth] Route Guard - Authenticated user at "${location}". Redirecting directly to "/dashboard".`);
        setLocation("/dashboard");
      }
    } else {
      if (location === "/dashboard" || location === "/placements" || location === "/add") {
        console.log(`[Debug Auth] Route Guard - Unauthenticated user trying to access protected "${location}". Redirecting to "/login".`);
        setLocation("/login");
      }
    }
  }, [location, isAuthenticated, loading, setLocation]);

  if (loading) {
    const hasToken = typeof window !== "undefined" && !!localStorage.getItem("token");
    
    if (hasToken) {
      if (!isBackendReady) {
        return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-bg-main px-4">
            <div className="max-w-md w-full text-center space-y-6 p-8 rounded-2xl bg-bg-elevated border border-border/40 shadow-xl backdrop-blur-md">
              {!isWakingTimeout && (
                <div className="flex justify-center">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-primary/20 animate-ping" />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <h2 className="text-lg font-medium text-text-main tracking-tight">Career OS</h2>
                <p className="text-sm text-text-muted transition-all duration-300">
                  {readinessMessage}
                </p>
              </div>
              {isWakingTimeout && (
                <Button 
                  onClick={retryReadiness}
                  className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/95"
                >
                  Retry Connection
                </Button>
              )}
            </div>
          </div>
        );
      }

      if (isAuthTransientError) {
        return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-bg-main px-4">
            <div className="max-w-md w-full text-center space-y-6 p-8 rounded-2xl bg-bg-elevated border border-border/40 shadow-xl backdrop-blur-md">
              <div className="space-y-2">
                <h2 className="text-lg font-medium text-text-main tracking-tight">Connection Issue</h2>
                <p className="text-sm text-text-muted">
                  The server is reachable, but we could not verify your session due to a network connection issue.
                </p>
              </div>
              <Button 
                onClick={retryAuth}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/95"
              >
                Retry Connection
              </Button>
            </div>
          </div>
        );
      }
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-main">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-bg-main">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      }
    >
      <Switch>
        <Route path="/">
          {isAuthenticated ? (
            <div className="min-h-screen flex items-center justify-center bg-bg-main">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <LandingPage />
          )}
        </Route>
        <Route path="/login">
          {isAuthenticated ? (
            <div className="min-h-screen flex items-center justify-center bg-bg-main">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <LoginPage />
          )}
        </Route>
        <Route path="/oauth-success" component={OAuthSuccessPage} />
        <Route path="/dashboard" component={Home} />
        <Route path="/placements" component={PlacementsPage} />
        <Route path="/add" component={AddEventPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  // Fire-and-forget background warm-up request to Render backend on app initial load
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log(`[Performance] App initialized: ${Math.round(performance.now())}ms`);
    }
    axios.get(`${BACKEND_URL}/actuator/health`, { timeout: 10000 })
      .then(() => {
        if (import.meta.env.DEV) {
          console.log(`[Performance] Backend first response: ${Math.round(performance.now())}ms`);
        }
      })
      .catch(() => {
        // Silently ignore errors - warm-up is non-blocking background request
      });
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="glass">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
