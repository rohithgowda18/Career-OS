import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import PublicProfile from "./pages/PublicProfile";
import ComponentShowcase from "./pages/ComponentShowcase";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import { startKeepAlive } from "./lib/keepAlive";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={LandingPage} />
      <Route path={"/login"} component={LoginPage} />
      <Route path={"/dashboard"} component={Home} />
      <Route path={"/profile/:username"} component={PublicProfile} />
      <Route path={"/showcase"} component={ComponentShowcase} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    startKeepAlive();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
