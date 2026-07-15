import { useState, useMemo, Suspense, lazy } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { analyticsApi } from "@/lib/api/analyticsApi";
import { applicationsApi } from "@/lib/api/applicationsApi";
import { placementsApi } from "@/lib/api/placementsApi";
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
  Clock,
  Compass
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isWithinInterval, addDays } from "date-fns";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

export default function DashboardView() {
  const { user } = useAuth();
  const [showAddAppModal, setShowAddAppModal] = useState(false);
  const [showAddPlacementModal, setShowAddPlacementModal] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);

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

  // Fetch placements list (to extract placement interview deadlines and status distributions)
  const placementsQuery = useQuery({
    queryKey: ["placements", { page: 0, size: 1000, sort: "id,desc" }],
    queryFn: () => placementsApi.list({ page: 0, size: 1000, sort: "id,desc" }),
  });

  // Fetch applications list (to identify pending response lists)
  const applicationsQuery = useQuery({
    queryKey: ["applications", { page: 0, size: 1000, sort: "deadline,asc" }],
    queryFn: () => applicationsApi.list({ page: 0, size: 1000, sort: "deadline,asc" }),
  });

  const isLoading = dashboardQuery.isLoading || placementsQuery.isLoading || applicationsQuery.isLoading;

  const dashboardData = dashboardQuery.data || {
    totalApplications: 0,
    upcomingDeadlines: 0,
    statusDistribution: {},
    immediateDeadlines: [],
    recentActivity: [],
  };

  const placements = placementsQuery.data?.content || [];
  const applications = applicationsQuery.data?.content || [];

  // 1. Calculations for dynamic home-view summaries
  const workspaceMetrics = useMemo(() => {
    const today = new Date();
    const endOfWeek = addDays(today, 7);

    // Filter event deadlines due today
    const appDeadlinesToday = applications.filter((app: any) => app.deadline && isToday(new Date(app.deadline)));
    const placementAssessmentsToday = placements.filter((p: any) => p.assessmentDate && isToday(new Date(p.assessmentDate)));
    const placementInterviewsToday = placements.filter((p: any) => p.interviewDate && isToday(new Date(p.interviewDate)));
    const totalPrioritiesCount = appDeadlinesToday.length + placementAssessmentsToday.length + placementInterviewsToday.length;

    // Filter interviews scheduled this week
    const appInterviewsThisWeek = applications.filter((app: any) => {
      if (app.status !== "UnderReview" && app.status !== "Interview") return false;
      return app.deadline && isWithinInterval(new Date(app.deadline), { start: today, end: endOfWeek });
    });
    const placementInterviewsThisWeek = placements.filter((p: any) => {
      return (
        (p.status === "INTERVIEW_SCHEDULED" || p.interviewDate) &&
        p.interviewDate &&
        isWithinInterval(new Date(p.interviewDate), { start: today, end: endOfWeek })
      );
    });
    const totalInterviewsThisWeek = appInterviewsThisWeek.length + placementInterviewsThisWeek.length;

    // Count applications awaiting response (Applied or UnderReview state)
    const appsAwaitingResponse = applications.filter((app: any) => app.status === "Applied" || app.status === "UnderReview");

    // Count offers awaiting decision (OFFER_RECEIVED placements or Accepted applications)
    const placementOffers = placements.filter((p: any) => p.status === "OFFER_RECEIVED");
    const appOffers = applications.filter((app: any) => app.status === "Accepted");
    const totalOffersCount = placementOffers.length + appOffers.length;

    return {
      prioritiesCount: totalPrioritiesCount,
      interviewsCount: totalInterviewsThisWeek,
      awaitingResponseCount: appsAwaitingResponse.length,
      offersCount: totalOffersCount,
      appsAwaiting: appsAwaitingResponse.slice(0, 4), // top 4 awaiting response
      appDeadlinesToday,
      placementAssessmentsToday,
      placementInterviewsToday,
    };
  }, [applications, placements]);

  // Combine priorities for today
  const todaysPrioritiesList = useMemo(() => {
    const items: any[] = [];
    workspaceMetrics.appDeadlinesToday.forEach((app: any) => {
      items.push({
        id: `priority-app-${app.id}`,
        title: `Deadline: ${app.eventName}`,
        subtitle: `${app.eventType} application closing date`,
        type: "deadline",
      });
    });
    workspaceMetrics.placementAssessmentsToday.forEach((p: any) => {
      items.push({
        id: `priority-place-as-${p.id}`,
        title: `Assessment: ${p.companyName}`,
        subtitle: `${p.role} recruitment test`,
        type: "assessment",
      });
    });
    workspaceMetrics.placementInterviewsToday.forEach((p: any) => {
      items.push({
        id: `priority-place-it-${p.id}`,
        title: `Interview: ${p.companyName}`,
        subtitle: `Discussion for ${p.role} position`,
        type: "interview",
      });
    });
    return items;
  }, [workspaceMetrics]);

  // Combine upcoming deadlines (next 7 days, excluding today)
  const upcomingDeadlinesList = useMemo(() => {
    const today = new Date();
    const nextWeek = addDays(today, 8);
    const items: any[] = [];

    applications.forEach((app: any) => {
      if (app.deadline && !isToday(new Date(app.deadline)) && isWithinInterval(new Date(app.deadline), { start: today, end: nextWeek })) {
        items.push({
          id: `upcoming-app-${app.id}`,
          name: app.eventName,
          label: app.eventType,
          date: new Date(app.deadline),
          status: app.status,
        });
      }
    });

    placements.forEach((p: any) => {
      if (p.assessmentDate && !isToday(new Date(p.assessmentDate)) && isWithinInterval(new Date(p.assessmentDate), { start: today, end: nextWeek })) {
        items.push({
          id: `upcoming-place-as-${p.id}`,
          name: `${p.companyName} (Assessment)`,
          label: p.role,
          date: new Date(p.assessmentDate),
          status: p.status,
        });
      }
      if (p.interviewDate && !isToday(new Date(p.interviewDate)) && isWithinInterval(new Date(p.interviewDate), { start: today, end: nextWeek })) {
        items.push({
          id: `upcoming-place-it-${p.id}`,
          name: `${p.companyName} (Interview)`,
          label: p.role,
          date: new Date(p.interviewDate),
          status: p.status,
        });
      }
    });

    return items.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 5);
  }, [applications, placements]);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
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
            {/* Priorities Skeleton */}
            <div className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
              <Skeleton className="h-4 w-36" />
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center p-3.5 border border-border/60 rounded-lg">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3.5 w-32" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Deadlines Today */}
          <div className="group relative bg-bg-card border border-border rounded-xl p-4 flex flex-col justify-between hover:border-primary/40 transition-all">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs text-text-muted font-medium">Deadlines Today</span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-bold",
                  workspaceMetrics.appDeadlinesToday.length > 0 ? "bg-danger/10 text-danger border border-danger/20" : "bg-bg-elevated text-text-dim"
                )}>
                  {workspaceMetrics.appDeadlinesToday.length}
                </span>
              </div>
              <p className="text-sm font-semibold text-text-main">
                {workspaceMetrics.appDeadlinesToday.length > 0 ? `${workspaceMetrics.appDeadlinesToday.length} application${workspaceMetrics.appDeadlinesToday.length > 1 ? 's' : ''} closing` : "No deadlines today"}
              </p>
              <p className="text-[11px] text-text-dim line-clamp-1">
                {workspaceMetrics.appDeadlinesToday.length > 0 ? workspaceMetrics.appDeadlinesToday.map((a: any) => a.eventName).join(", ") : "You're all caught up."}
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
                  workspaceMetrics.interviewsCount > 0 ? "bg-primary/10 text-primary border border-primary/20" : "bg-bg-elevated text-text-dim"
                )}>
                  {workspaceMetrics.interviewsCount}
                </span>
              </div>
              <p className="text-sm font-semibold text-text-main">
                {workspaceMetrics.interviewsCount > 0 ? `${workspaceMetrics.interviewsCount} meeting${workspaceMetrics.interviewsCount > 1 ? 's' : ''} scheduled` : "No interviews this week"}
              </p>
              <p className="text-[11px] text-text-dim line-clamp-1">
                {workspaceMetrics.interviewsCount > 0 ? "Prepare and practice your pitches." : "Keep applying to get meetings."}
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

          {/* Card 3: Awaiting Responses */}
          <div className="group relative bg-bg-card border border-border rounded-xl p-4 flex flex-col justify-between hover:border-primary/40 transition-all">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs text-text-muted font-medium">Awaiting Responses</span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-bold",
                  workspaceMetrics.awaitingResponseCount > 0 ? "bg-warning/10 text-warning border border-warning/20" : "bg-bg-elevated text-text-dim"
                )}>
                  {workspaceMetrics.awaitingResponseCount}
                </span>
              </div>
              <p className="text-sm font-semibold text-text-main">
                {workspaceMetrics.awaitingResponseCount > 0 ? `${workspaceMetrics.awaitingResponseCount} application${workspaceMetrics.awaitingResponseCount > 1 ? 's' : ''} pending` : "No pending applications"}
              </p>
              <p className="text-[11px] text-text-dim line-clamp-1">
                {workspaceMetrics.awaitingResponseCount > 0 ? "Consider sending a follow-up email." : "Submit applications to build funnel."}
              </p>
            </div>
            <Button
              onClick={() => window.history.pushState(null, "", "/dashboard?view=kanban")}
              className="w-full mt-4 justify-between text-[11px] font-semibold h-8 border border-border bg-bg-elevated hover:bg-bg-elevated/80 text-text-main cursor-pointer"
            >
              <span>Follow Up</span>
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
                  workspaceMetrics.offersCount > 0 ? "bg-success/10 text-success border border-success/20 animate-pulse" : "bg-bg-elevated text-text-dim"
                )}>
                  {workspaceMetrics.offersCount}
                </span>
              </div>
              <p className="text-sm font-semibold text-text-main">
                {workspaceMetrics.offersCount > 0 ? `${workspaceMetrics.offersCount} active offer${workspaceMetrics.offersCount > 1 ? 's' : ''} received!` : "No offers yet"}
              </p>
              <p className="text-[11px] text-text-dim line-clamp-1">
                {workspaceMetrics.offersCount > 0 ? "Congratulations! Review terms carefully." : "The breakthrough is coming soon."}
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
          
          {/* Section 1: Today's Priorities */}
          <section className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-primary" /> Today's Priorities
            </h3>
            
            {todaysPrioritiesList.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center border border-dashed border-border/60 rounded-lg bg-bg-main/20">
                <CheckCircle2 className="w-6 h-6 text-success/70 mb-2" />
                <p className="text-xs font-medium text-text-muted">All clear for today</p>
                <p className="text-[11px] text-text-dim mt-0.5">No tasks or deadlines scheduled.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todaysPrioritiesList.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3.5 rounded-lg bg-bg-main border border-border/80 hover:border-border transition-all"
                  >
                    <div>
                      <p className="text-xs font-semibold text-text-main">{item.title}</p>
                      <p className="text-[11px] text-text-dim mt-0.5">{item.subtitle}</p>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-danger/10 border border-danger/25 text-danger">
                      Due Today
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

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
              <Inbox className="w-3.5 h-3.5 text-primary" /> Awaiting Feedback
            </h3>

            {workspaceMetrics.appsAwaiting.length === 0 ? (
              <div className="py-6 text-center text-xs text-text-dim">
                No applications currently awaiting feedback
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {workspaceMetrics.appsAwaiting.map((app: any) => (
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
                      <span>{format(new Date(act.createdAt || act.updatedAt || new Date()), "MMM dd")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Funnel Progress Indicator */}
          <section className="bg-bg-card border border-border rounded-xl p-5 space-y-3.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-primary" /> Pipeline Distribution
            </h3>
            
            <div className="space-y-2.5">
              {["Applied", "UnderReview", "Accepted", "Rejected"].map((statusName) => {
                const count = dashboardData.statusDistribution[statusName] || 0;
                const total = dashboardData.totalApplications || 1;
                const percentage = Math.round((count / total) * 100);
                
                return (
                  <div key={statusName} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-medium text-text-muted">
                      <span>{statusName === "UnderReview" ? "In Review" : statusName}</span>
                      <span className="text-text-main">{count}</span>
                    </div>
                    <div className="w-full h-1 bg-bg-main border border-border rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          statusName === "Accepted" ? "bg-success" : statusName === "Rejected" ? "bg-danger" : "bg-primary"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
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
