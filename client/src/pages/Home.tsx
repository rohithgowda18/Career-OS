import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, Settings } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PWAInstallButton } from "@/components/PWAInstallButton";
import DashboardView from "@/components/views/DashboardView";
import KanbanView from "@/components/views/KanbanView";
import ListView from "@/components/views/ListView";
import CalendarView from "@/components/views/CalendarView";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import SettingsPage from "@/components/SettingsPage";

export default function Home() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<"dashboard" | "kanban" | "list" | "calendar" | "analytics" | "settings">("dashboard");
  
  const preferencesQuery = trpc.preferences.get.useQuery();
  const preferences = preferencesQuery.data;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <span className="text-lg font-bold text-accent">📋</span>
            </div>
            <h1 className="text-xl font-bold text-foreground">Event Tracker</h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Welcome, {user?.name || "User"}</span>
            <PWAInstallButton />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentView("settings")}
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      {currentView !== "settings" && (
        <div className="sticky top-16 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="container flex gap-1 h-12">
            {[
              { id: "dashboard", label: "Dashboard" },
              { id: "kanban", label: "Kanban" },
              { id: "list", label: "List" },
              { id: "calendar", label: "Calendar" },
              { id: "analytics", label: "Analytics" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentView(tab.id as any)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  currentView === tab.id
                    ? "border-accent text-accent"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="container py-8">
        {currentView === "dashboard" && <DashboardView />}
        {currentView === "kanban" && <KanbanView />}
        {currentView === "list" && <ListView />}
        {currentView === "calendar" && <CalendarView />}
        {currentView === "analytics" && <AnalyticsDashboard />}
        {currentView === "settings" && (
          <SettingsPage onBack={() => setCurrentView("dashboard")} />
        )}
      </main>
    </div>
  );
}
