import {
  Loader2,
  Calendar,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import AddApplicationModal from "@/components/AddApplicationModal";
import { useQuery } from "@tanstack/react-query";
import { applicationsApi } from "@/lib/api/applicationsApi";
import { cn } from "@/lib/utils";

export default function DashboardView() {
  const [showAddModal, setShowAddModal] = useState(false);
  const applicationsQuery = useQuery({
    queryKey: ["applications"],
    queryFn: () => applicationsApi.list(0, 1000),
  });
  const applications = Array.isArray(applicationsQuery.data)
    ? applicationsQuery.data
    : (applicationsQuery.data?.content || []);

  const stats = useMemo(() => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingDeadlines = applications.filter((app: any) => {
      if (!app.deadline) return false;
      const deadline = new Date(app.deadline);
      return deadline >= now && deadline <= sevenDaysFromNow;
    });

    const statusCounts = {
      Interested: applications.filter((a: any) => a.status === "Interested").length,
      Applied: applications.filter((a: any) => a.status === "Applied").length,
      UnderReview: applications.filter((a: any) => a.status === "UnderReview").length,
      Accepted: applications.filter((a: any) => a.status === "Accepted").length,
      Rejected: applications.filter((a: any) => a.status === "Rejected").length,
    };

    const recentActivity = [...applications].sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, 5);

    return {
      totalApplications: applications.length,
      upcomingDeadlines: upcomingDeadlines.length,
      statusCounts,
      recentActivity,
      allUpcomingDeadlines: upcomingDeadlines.sort(
        (a: any, b: any) =>
          new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime()
      ),
    };
  }, [applications]);

  if (applicationsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
            <p className="text-sm text-text-muted">High-level snapshot of your application pipeline.</p>
         </div>
         <Button 
           onClick={() => setShowAddModal(true)}
           className="btn-primary"
         >
           <Plus className="w-4 h-4 mr-2" /> New Application
         </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          label="Volume" 
          value={stats.totalApplications} 
          icon={<TrendingUp className="w-5 h-5 text-primary" />}
        />
        <StatCard 
          label="Deadlines" 
          value={stats.upcomingDeadlines} 
          icon={<AlertCircle className="w-5 h-5 text-accent" />}
        />
        <StatCard 
          label="Accepted" 
          value={stats.statusCounts.Accepted} 
          icon={<CheckCircle2 className="w-5 h-5 text-success" />}
        />
        <StatCard 
          label="In Review" 
          value={stats.statusCounts.UnderReview} 
          icon={<Calendar className="w-5 h-5 text-amber-500" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <section className="card-premium p-6">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 uppercase tracking-widest text-[11px] text-text-muted">
              Immediate Deadlines
            </h3>
            {stats.allUpcomingDeadlines.length === 0 ? (
              <EmptyState title="No applications yet" subtitle="Start by adding your first one 🚀" />
            ) : (
              <div className="space-y-3">
                {stats.allUpcomingDeadlines.map((app: any) => (
                  <div key={app.id} className="flex items-center justify-between p-4 rounded-xl bg-bg-elevated/40 border border-border group hover:border-primary/40 transition-all">
                    <div className="min-w-0 flex-1 mr-4">
                      <p className="font-bold text-sm text-text-main group-hover:text-primary transition-colors truncate">{app.eventName}</p>
                      <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mt-1">
                        {app.eventType} • DUE {new Date(app.deadline!).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={cn(
                      "badge-status",
                      getStatusBadgeClass(app.status)
                    )}>{app.status}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card-premium p-6">
            <h3 className="text-lg font-bold mb-6 uppercase tracking-widest text-[11px] text-text-muted">
              Recent Activity
            </h3>
            {stats.recentActivity.length === 0 ? (
              <EmptyState title="No recent activity" subtitle="Your journey starts with a single click." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stats.recentActivity.map((app: any) => (
                  <div key={app.id} className="p-4 rounded-xl bg-bg-elevated/20 border border-border hover:border-primary/20 transition-all group">
                    <div className="flex items-center justify-between mb-3">
                       <p className="text-[10px] font-black text-text-muted uppercase tracking-widest group-hover:text-primary transition-colors">{app.eventType}</p>
                       <span className={cn("text-[8px] font-black px-2 py-0.5 rounded border uppercase", getStatusBadgeClass(app.status))}>
                          {app.status}
                       </span>
                    </div>
                    <p className="font-bold text-sm text-text-main truncate mb-1">{app.eventName}</p>
                    <p className="text-[10px] text-text-muted">Created {new Date(app.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="lg:col-span-1">
          <section className="card-premium p-6 sticky top-36">
            <h3 className="text-lg font-bold mb-6 uppercase tracking-widest text-[11px] text-text-muted">
              Pipeline Distribution
            </h3>
            <div className="space-y-6">
              {Object.entries(stats.statusCounts).map(([status, count]) => {
                const percentage = stats.totalApplications > 0 ? (count / stats.totalApplications) * 100 : 0;
                return (
                  <div key={status} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-text-muted uppercase tracking-widest group-hover:text-text-main transition-colors">{status === "UnderReview" ? "Under Review" : status}</span>
                      <span className="text-xs font-black text-text-main tabular-nums">{count}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-bg-elevated border border-border overflow-hidden">
                       <div className={cn("h-full transition-all duration-1000 shadow-[0_0_8px_rgba(249,115,22,0.4)]", getProgressBarColor(status))} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-10 pt-6 border-t border-border flex flex-col items-center">
               <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Overall Success Rate</p>
               <p className="text-4xl font-black text-primary mt-2 tabular-nums">
                 {stats.totalApplications > 0 ? ((stats.statusCounts.Accepted / stats.totalApplications) * 100).toFixed(0) : 0}%
               </p>
            </div>
          </section>
        </div>
      </div>

      <AddApplicationModal open={showAddModal} onOpenChange={setShowAddModal} />
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="card-premium p-6 group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{label}</p>
          <p className="text-3xl font-black text-text-main mt-3 group-hover:text-primary transition-colors tabular-nums">{value}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-bg-elevated flex items-center justify-center transition-all group-hover:scale-110 shadow-inner border border-border group-hover:border-primary/30">
          {icon}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-border rounded-2xl bg-bg-elevated/5 group">
      <div className="w-12 h-12 rounded-full bg-bg-elevated flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
         <Plus className="w-6 h-6 text-text-muted/20" />
      </div>
      <p className="text-sm font-bold text-text-muted uppercase tracking-widest mb-1">{title}</p>
      <p className="text-[11px] text-text-muted/50 font-medium">{subtitle}</p>
    </div>
  );
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "Accepted": return "bg-success/10 text-success border-success/20";
    case "Rejected": return "bg-danger/10 text-danger border-danger/20";
    case "UnderReview": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    case "Applied": return "bg-primary/10 text-primary border-primary/20";
    default: return "bg-bg-elevated text-text-muted border-border";
  }
}

function getProgressBarColor(status: string): string {
  switch (status) {
    case "Accepted": return "bg-success";
    case "Rejected": return "bg-danger";
    case "UnderReview": return "bg-amber-500";
    case "Applied": return "bg-primary";
    default: return "bg-text-muted";
  }
}
