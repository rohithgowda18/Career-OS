import React, { Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import DashboardView from "@/components/views/DashboardView";
const KanbanView = React.lazy(() => import("@/components/views/KanbanView"));
const CalendarView = React.lazy(() => import("@/components/views/CalendarView"));
const AnalyticsDashboard = React.lazy(() => import("@/components/AnalyticsDashboard"));
const ApplicationProfileForm = React.lazy(() => import("@/components/ApplicationProfileForm"));
const SkillsPage = React.lazy(() => import("./SkillsPage"));
const RoutineView = React.lazy(() => import("@/components/views/RoutineView"));
import DashboardLayout from "@/components/DashboardLayout";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

// Patch history methods to dispatch custom locationchange events on navigation
if (typeof window !== "undefined" && !(window.history as any)._patched) {
  (window.history as any)._patched = true;

  const pushState = window.history.pushState;
  window.history.pushState = function (...args) {
    const result = pushState.apply(this, args);
    window.dispatchEvent(new Event("pushstate"));
    window.dispatchEvent(new Event("locationchange"));
    return result;
  };

  const replaceState = window.history.replaceState;
  window.history.replaceState = function (...args) {
    const result = replaceState.apply(this, args);
    window.dispatchEvent(new Event("replacestate"));
    window.dispatchEvent(new Event("locationchange"));
    return result;
  };

  window.addEventListener("popstate", () => {
    window.dispatchEvent(new Event("locationchange"));
  });
}

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [searchParams, setSearchParams] = useState(new URLSearchParams(window.location.search));

  useEffect(() => {
    const handleLocationChange = () => {
      setSearchParams(new URLSearchParams(window.location.search));
    };

    window.addEventListener("locationchange", handleLocationChange);
    return () => {
      window.removeEventListener("locationchange", handleLocationChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-main">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!loading && !user) {
    setLocation("/login");
    return null;
  }

  const currentView = (searchParams.get("view") || "dashboard") as
    | "dashboard"
    | "kanban"
    | "calendar"
    | "analytics"
    | "skills"
    | "routine"
    | "profile";

  return (
    <DashboardLayout activeTab={currentView}>
      <Suspense fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      }>
        {currentView === "dashboard" && <DashboardView />}
        {currentView === "kanban" && <KanbanView />}
        {currentView === "calendar" && <CalendarView />}
        {currentView === "analytics" && <AnalyticsDashboard />}
        {currentView === "skills" && <SkillsPage />}
        {currentView === "routine" && <RoutineView />}
        {currentView === "profile" && <ApplicationProfileForm />}
      </Suspense>
    </DashboardLayout>
  );
}
