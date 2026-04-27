import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PWAInstallButton } from "@/components/PWAInstallButton";
import DashboardView from "@/components/views/DashboardView";
import KanbanView from "@/components/views/KanbanView";
import CalendarView from "@/components/views/CalendarView";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import SettingsPage from "@/components/SettingsPage";
import { profileApi } from "@/lib/api/profileApi";

export default function Home() {
  const { user, loading, logout } = useAuth();
  const [currentView, setCurrentView] = useState<
    "dashboard" | "kanban" | "calendar" | "analytics" | "settings"
  >("dashboard");

  const preferencesQuery = useQuery({
    queryKey: ["preferences"],
    queryFn: profileApi.getPreferences,
  });
  const preferences = preferencesQuery.data;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!loading && !user) {
    window.location.href = "/login";
    return null;
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

          <div className="flex items-center gap-4">
            <PWAInstallButton />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center outline-none">
                  <Avatar className="h-9 w-9 border cursor-pointer hover:opacity-80 transition-opacity">
                    <AvatarFallback className="text-xs font-medium bg-accent text-accent-foreground">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.name || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email || "No email"}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setCurrentView("settings")}
                  className="cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
              { id: "calendar", label: "Calendar" },
              { id: "analytics", label: "Analytics" },
            ].map(tab => (
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
        {currentView === "calendar" && <CalendarView />}
        {currentView === "analytics" && <AnalyticsDashboard />}
        {currentView === "settings" && (
          <SettingsPage onBack={() => setCurrentView("dashboard")} />
        )}
      </main>
    </div>
  );
}
