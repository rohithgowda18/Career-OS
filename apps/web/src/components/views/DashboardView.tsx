import { useState, useMemo, Suspense, lazy } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { analyticsApi } from "@/lib/api/analyticsApi";
import { applicationsApi } from "@/lib/api/applicationsApi";
import { placementsApi } from "@/lib/api/placementsApi";
import { routineApi } from "@/lib/api/routineApi";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AddApplicationModal from "@/components/AddApplicationModal";
import AddPlacementModal from "@/components/AddPlacementModal";
const AnalyticsDashboard = lazy(() => import("@/components/AnalyticsDashboard"));
import {
  Loader2,
  Calendar,
  AlertCircle,
  Plus,
  Briefcase,
  Activity,
  ArrowRight,
  CheckCircle2,
  Inbox,
  Square,
  CheckSquare,
  ListTodo
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isWithinInterval, addDays } from "date-fns";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";
import EmptyState from "@/components/ui/EmptyState";

export default function DashboardView() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddAppModal, setShowAddAppModal] = useState(false);
  const [showAddPlacementModal, setShowAddPlacementModal] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);

  // Fetch daily routines
  const routinesQuery = useQuery({
    queryKey: ["routines"],
    queryFn: routineApi.list,
    enabled: !!user,
  });

  // Fetch routine reports for weekly summary
  const reportsQuery = useQuery({
    queryKey: ["routines", "reports"],
    queryFn: routineApi.reports,
    enabled: !!user,
  });

  const routines = routinesQuery.data || [];
  const completedTasksCount = routines.filter((t) => t.completed).length;
  const totalTasksCount = routines.length;
  const completionPercentage = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  const toggleTaskMutation = useMutation({
    mutationFn: routineApi.toggle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] });
      queryClient.invalidateQueries({ queryKey: ["routines", "reports"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to toggle task");
    }
  });

  // Username display
  const userName = useMemo(() => {
    if (user?.displayName && user.displayName.trim() !== "") return user.displayName;
    if (!user?.email) return "Builder";
    const prefix = user.email.split("@")[0];
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }, [user]);

  // Reactive Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  // Fetch baseline dashboard overview (returns total counts, status distribution, immediate event deadlines, and recent activity)
  const dashboardQuery = useQuery({
    queryKey: ["analytics", "dashboard"],
    queryFn: () => analyticsApi.dashboard(),
  });

  const isLoading = dashboardQuery.isLoading;

  const dashboardData = dashboardQuery.data || {
    totalApplications: 0,
    deadlinesToday: [],
    deadlinesTodayCount: 0,
    interviewsThisWeek: 0,
    awaitingResponses: 0,
    offersAwaitingDecision: 0,
    upcomingDeadlines: [],
    upcomingDeadlinesCount: 0,
    awaitingFeedback: [],
    recentActivity: [],
  };

  // Combine upcoming deadlines (next 7 days, excluding today)
  const upcomingDeadlinesList = useMemo(() => {
    const items: any[] = [];
    (dashboardData.upcomingDeadlines || []).forEach((app: any) => {
      items.push({
        id: `upcoming-app-${app.id}`,
        name: app.eventName,
        label: app.eventType,
        date: new Date(app.deadline),
        status: app.status,
      });
    });
    return items;
  }, [dashboardData]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header Skeleton */}
        <div className="border-b border-border/60 pb-6 space-y-3">
          <Skeleton className="h-9 w-64" />
          <div className="flex flex-col sm:flex-row gap-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-36" />
          </div>
        </div>

        {/* Focus Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-bg-card border border-border rounded-xl p-4 space-y-4 animate-pulse">
              <div className="flex justify-between items-start">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-8 rounded-full" />
              </div>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-8 w-full mt-4" />
            </div>
          ))}
        </div>

        {/* Main Columns Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
          </div>

          <div className="space-y-6">
            {/* Quick Actions Skeleton */}
            <div className="bg-bg-card border border-border rounded-xl p-5 space-y-3.5">
              <Skeleton className="h-4 w-28" />
              <div className="space-y-2">
                <Skeleton className="h-9.5 w-full" />
                <Skeleton className="h-9.5 w-full" />
                <Skeleton className="h-9.5 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Personalized Greeting Header */}
      <div className="border-b border-border/60 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-[24px] sm:text-[32px] font-bold tracking-tight text-text-main">
          {greeting}, {userName}
        </h2>
      </div>

      {/* Today's Focus Action Cards Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim">Today's Focus</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Deadlines Today */}
          <div className="group relative bg-bg-card border border-border rounded-xl p-4 flex flex-col justify-between hover:border-primary/40 transition-all">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs text-text-muted font-medium">Deadlines Today</span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-bold",
                  dashboardData.deadlinesTodayCount > 0 ? "bg-danger/10 text-danger border border-danger/20" : "bg-bg-elevated text-text-dim"
                )}>
                  {dashboardData.deadlinesTodayCount}
                </span>
              </div>
              <p className="text-sm font-semibold text-text-main">
                {dashboardData.deadlinesTodayCount > 0 ? `${dashboardData.deadlinesTodayCount} application${dashboardData.deadlinesTodayCount > 1 ? 's' : ''} closing` : "No deadlines today"}
              </p>
              <p className="text-[11px] text-text-dim line-clamp-1">
                {dashboardData.deadlinesTodayCount > 0 ? dashboardData.deadlinesToday.map((a: any) => a.eventName).join(", ") : "You're all caught up."}
              </p>
            </div>
            <Button
              onClick={() => window.history.pushState(null, "", "/dashboard?view=calendar")}
              className="w-full mt-4 justify-between text-[11px] font-semibold h-8 border border-border bg-bg-elevated hover:bg-bg-elevated/80 text-text-main cursor-pointer"
            >
              <span>View Calendar</span>
              <ArrowRight className="w-3 h-3 text-text-dim group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </div>

          {/* Card 2: Interviews This Week */}
          <div className="group relative bg-bg-card border border-border rounded-xl p-4 flex flex-col justify-between hover:border-primary/40 transition-all">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs text-text-muted font-medium">Interviews This Week</span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-bold",
                  dashboardData.interviewsThisWeek > 0 ? "bg-primary/10 text-primary border border-primary/20" : "bg-bg-elevated text-text-dim"
                )}>
                  {dashboardData.interviewsThisWeek}
                </span>
              </div>
              <p className="text-sm font-semibold text-text-main">
                {dashboardData.interviewsThisWeek > 0 ? `${dashboardData.interviewsThisWeek} meeting${dashboardData.interviewsThisWeek > 1 ? 's' : ''} scheduled` : "No interviews this week"}
              </p>
              <p className="text-[11px] text-text-dim line-clamp-1">
                {dashboardData.interviewsThisWeek > 0 ? "Prepare and practice your pitches." : "Keep applying to get meetings."}
              </p>
            </div>
            <Button
              onClick={() => window.history.pushState(null, "", "/dashboard?view=calendar")}
              className="w-full mt-4 justify-between text-[11px] font-semibold h-8 border border-border bg-bg-elevated hover:bg-bg-elevated/80 text-text-main cursor-pointer"
            >
              <span>View Schedule</span>
              <ArrowRight className="w-3 h-3 text-text-dim group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </div>

          {/* Card 4: Offers Awaiting Decision */}
          <div className="group relative bg-bg-card border border-border rounded-xl p-4 flex flex-col justify-between hover:border-primary/40 transition-all">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs text-text-muted font-medium">Offers Awaiting Decision</span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-bold",
                  dashboardData.offersAwaitingDecision > 0 ? "bg-success/10 text-success border border-success/20 animate-pulse" : "bg-bg-elevated text-text-dim"
                )}>
                  {dashboardData.offersAwaitingDecision}
                </span>
              </div>
              <p className="text-sm font-semibold text-text-main">
                {dashboardData.offersAwaitingDecision > 0 ? `${dashboardData.offersAwaitingDecision} active offer${dashboardData.offersAwaitingDecision > 1 ? 's' : ''} received!` : "No offers yet"}
              </p>
              <p className="text-[11px] text-text-dim line-clamp-1">
                {dashboardData.offersAwaitingDecision > 0 ? "Congratulations! Review terms carefully." : "The breakthrough is coming soon."}
              </p>
            </div>
            <Button
              onClick={() => window.history.pushState(null, "", "/placements")}
              className="w-full mt-4 justify-between text-[11px] font-semibold h-8 border border-border bg-bg-elevated hover:bg-bg-elevated/80 text-text-main cursor-pointer"
            >
              <span>Review Offers</span>
              <ArrowRight className="w-3 h-3 text-text-dim group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Two-Column Workflow Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Hand: Workflow Tasks */}
        <div className="lg:col-span-2 space-y-6">
          


          {/* Section 2: Upcoming Deadlines */}
          <section className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-primary" /> Upcoming Deadlines (Next 7 Days)
            </h3>

            {upcomingDeadlinesList.length === 0 ? (
              <div className="py-6 text-center text-xs text-text-dim">
                No upcoming deadlines in the next week
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {upcomingDeadlinesList.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-text-main truncate">{item.name}</p>
                      <p className="text-[11px] text-text-dim mt-0.5 truncate">{item.label}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium text-text-main">{format(item.date, "MMM d")}</p>
                      <p className="text-[10px] text-text-dim mt-0.5">Due soon</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section 4: Applications Awaiting Response */}
          <section className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim flex items-center gap-2">
              <Inbox className="w-3.5 h-3.5 text-primary" /> Awaiting Responses
            </h3>

            {dashboardData.awaitingFeedback.length === 0 ? (
              <div className="py-6 text-center text-xs text-text-dim">
                No applications currently awaiting responses
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dashboardData.awaitingFeedback.map((app: any) => (
                  <div
                    key={app.id}
                    className="p-3 rounded-lg bg-bg-main border border-border/80 hover:border-border transition-all flex flex-col justify-between"
                  >
                    <div>
                      <p className="text-xs font-semibold text-text-main truncate">{app.eventName}</p>
                      <p className="text-[10px] text-text-dim mt-0.5 uppercase tracking-wider">{app.eventType}</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary">
                        {app.status === "UnderReview" ? "In Review" : app.status}
                      </span>
                      <span className="text-[10px] text-text-dim font-medium">
                        {app.deadline ? format(new Date(app.deadline), "MM/dd") : "No date"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Hand Sidebar (Context and Actions) */}
        <div className="space-y-6">
          {/* Today's Routine Widget */}
          <section className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim flex items-center gap-1.5">
                <ListTodo className="w-3.5 h-3.5 text-primary" /> Today's Routine
              </h3>
              <button
                onClick={() => window.history.pushState(null, "", "/dashboard?view=routine")}
                className="text-[10px] font-bold text-primary hover:text-primary-hover flex items-center gap-0.5 cursor-pointer"
              >
                Manage
              </button>
            </div>

            {/* Today's Progress Bar */}
            {totalTasksCount > 0 && (
              <div className="space-y-1.5 bg-bg-main/30 border border-border/50 rounded-lg p-2.5">
                <div className="flex justify-between text-[10px] font-bold text-text-muted">
                  <span>Today's Progress</span>
                  <span className="text-text-main">{completedTasksCount} / {totalTasksCount} Completed ({completionPercentage}%)</span>
                </div>
                <div className="w-full h-1 bg-bg-main border border-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            )}

            {routines.length === 0 ? (
              <div className="py-5 text-center border border-dashed border-border/60 rounded-lg bg-bg-main/20 flex flex-col items-center justify-center">
                <p className="text-[11px] text-text-dim font-medium">No routine tasks defined.</p>
                <button
                  onClick={() => window.history.pushState(null, "", "/dashboard?view=routine")}
                  className="text-[10px] font-bold text-primary hover:underline mt-1 cursor-pointer"
                >
                  Create your daily routine
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {routines.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-bg-main/50 border border-border/40 hover:border-border/80 transition-all text-xs"
                  >
                    <button
                      onClick={() => toggleTaskMutation.mutate(task.id)}
                      className="text-text-muted hover:text-primary transition-all shrink-0 cursor-pointer"
                      title={task.completed ? "Mark incomplete" : "Mark completed"}
                    >
                      {task.completed ? (
                        <CheckSquare className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <Square className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <span
                      className={`font-medium truncate flex-1 ${
                        task.completed ? "line-through text-text-dim" : "text-text-main"
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Compact Weekly Progress Summary */}
            {totalTasksCount > 0 && reportsQuery.data && (
              <div className="border-t border-border/40 pt-3 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-text-dim">
                  <span>Weekly Progress</span>
                  <span className="text-[9px] text-primary lowercase font-semibold">streak: {reportsQuery.data.currentStreak} days</span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"].map((day) => {
                    const dayLabelsMap: Record<string, string> = {
                      MONDAY: "M", TUESDAY: "T", WEDNESDAY: "W", THURSDAY: "T", FRIDAY: "F", SATURDAY: "S", SUNDAY: "S"
                    };
                    const pct = reportsQuery.data.weeklyCompletion?.[day] ?? 0;
                    return (
                      <div key={day} className="flex flex-col items-center gap-1">
                        <div className="w-full h-8 bg-bg-main border border-border/60 rounded flex flex-col justify-end overflow-hidden">
                          <div
                            className="w-full bg-primary rounded-t transition-all duration-300"
                            style={{ height: `${pct}%` }}
                            title={`${pct}%`}
                          />
                        </div>
                        <span className="text-[8px] font-bold text-text-dim">{dayLabelsMap[day]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* Quick Actions Panel */}
          <section className="bg-bg-card border border-border rounded-xl p-5 space-y-3.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                onClick={() => setShowAddAppModal(true)}
                className="w-full justify-start text-xs font-medium h-9.5 border border-border bg-bg-elevated hover:bg-bg-elevated/85 text-text-main"
              >
                <Plus className="w-3.5 h-3.5 mr-2 text-primary" /> New Application
              </Button>
              <Button
                onClick={() => setShowAddPlacementModal(true)}
                className="w-full justify-start text-xs font-medium h-9.5 border border-border bg-bg-elevated hover:bg-bg-elevated/85 text-text-main"
              >
                <Briefcase className="w-3.5 h-3.5 mr-2 text-primary" /> Add Placement
              </Button>
              <Button
                onClick={() => setShowInsightsModal(true)}
                className="w-full justify-start text-xs font-medium h-9.5 border border-primary/20 bg-primary/10 hover:bg-primary/15 text-primary"
              >
                <Activity className="w-3.5 h-3.5 mr-2" /> View Career Insights
              </Button>
            </div>
          </section>

          {/* Section 3: Recent Activity */}
          <section className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim">Recent Activity</h3>
            {dashboardData.recentActivity.length === 0 ? (
              <EmptyState
                title="No Activity"
                description="No recent status updates or logging activity found. Updates will appear as you progress in your recruitment cycles."
                icon={Activity}
              />
            ) : (
              <div className="space-y-3">
                {dashboardData.recentActivity.map((act: any) => (
                  <div key={act.id} className="text-xs space-y-1">
                    <p className="font-semibold text-text-main truncate">{act.eventName}</p>
                    <div className="flex items-center justify-between text-[10px] text-text-dim">
                      <span>Updated to {act.status === "UnderReview" ? "In Review" : act.status}</span>
                      <span>{format(new Date(act.updatedAt || act.createdAt || new Date()), "MMM dd")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>


        </div>
      </div>

      {/* Modals & Dialog overlays */}
      <AddApplicationModal open={showAddAppModal} onOpenChange={setShowAddAppModal} />
      <AddPlacementModal open={showAddPlacementModal} onOpenChange={setShowAddPlacementModal} />

      {/* Insights Overlay Dialog */}
      <Dialog open={showInsightsModal} onOpenChange={setShowInsightsModal}>
        <DialogContent className="max-w-4xl bg-bg-card border-border text-text-main p-0 overflow-y-auto max-h-[90vh] rounded-xl shadow-2xl">
          <DialogHeader className="p-6 bg-bg-elevated/35 border-b border-border">
            <DialogTitle className="text-base font-semibold">Career Insights & Success Yields</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <Suspense fallback={
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            }>
              <AnalyticsDashboard />
            </Suspense>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
