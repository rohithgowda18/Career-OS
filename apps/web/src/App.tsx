import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Loader2 } from "lucide-react";

// Lazy load route pages to improve load performance
const LandingPage = React.lazy(() => import("./pages/LandingPage"));
const LoginPage = React.lazy(() => import("./pages/LoginPage"));
const OAuthSuccessPage = React.lazy(() => import("./pages/OAuthSuccessPage"));
const Home = React.lazy(() => import("./pages/Home"));
const PlacementsPage = React.lazy(() => import("./pages/PlacementsPage"));
const AddEventPage = React.lazy(() => import("./pages/AddEventPage"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

function Router() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-bg-main">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      }
    >
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/oauth-success" component={OAuthSuccessPage} />
        <Route path="/dashboard" component={Home} />
        <Route path="/placements" component={PlacementsPage} />
        <Route path="/add" component={AddEventPage} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
