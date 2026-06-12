import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import DashboardView from "@/components/views/DashboardView";
import KanbanView from "@/components/views/KanbanView";
import CalendarView from "@/components/views/CalendarView";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import ApplicationProfileForm from "@/components/ApplicationProfileForm";
import DashboardLayout from "@/components/DashboardLayout";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-main">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!loading && !user) {
    window.location.href = "/login";
    return null;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const currentView = (searchParams.get("view") || "dashboard") as
    | "dashboard"
    | "kanban"
    | "calendar"
    | "analytics"
    | "profile";

  return (
    <DashboardLayout activeTab={currentView}>
      {currentView === "dashboard" && <DashboardView />}
      {currentView === "kanban" && <KanbanView />}
      {currentView === "calendar" && <CalendarView />}
      {currentView === "analytics" && <AnalyticsDashboard />}
      {currentView === "profile" && <ApplicationProfileForm />}
    </DashboardLayout>
  );
}
