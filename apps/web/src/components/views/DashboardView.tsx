import {
  Loader2,
  Calendar,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import AddApplicationModal from "@/components/AddApplicationModal";
import RecommendationsPanel from "@/components/RecommendationsPanel";
import { useQuery } from "@tanstack/react-query";
import { applicationsApi } from "@/lib/api/applicationsApi";

export default function DashboardView() {
  const [showAddModal, setShowAddModal] = useState(false);
  const applicationsQuery = useQuery({
    queryKey: ["applications"],
    queryFn: applicationsApi.list,
  });
  const applications = applicationsQuery.data || [];

  const stats = useMemo(() => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingDeadlines = applications.filter((app: any) => {
      if (!app.deadline) return false;
      const deadline = new Date(app.deadline);
      return deadline >= now && deadline <= sevenDaysFromNow;
    });

    const statusCounts = {
      Interested: applications.filter((a: any) => a.status === "Interested")
        .length,
      Applied: applications.filter((a: any) => a.status === "Applied").length,
      "Under Review": applications.filter(
        (a: any) => a.status === "Under Review"
      ).length,
      Accepted: applications.filter((a: any) => a.status === "Accepted").length,
      Rejected: applications.filter((a: any) => a.status === "Rejected").length,
      Withdrawn: applications.filter((a: any) => a.status === "Withdrawn")
        .length,
    };

    const recentActivity = applications.slice(0, 5);

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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Applications */}
        <div className="card-elevated p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">
                Total Applications
              </p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {stats.totalApplications}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="card-elevated p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">
                Upcoming (7 days)
              </p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {stats.upcomingDeadlines}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>

        {/* Accepted */}
        <div className="card-elevated p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">
                Accepted
              </p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {stats.statusCounts.Accepted}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="card-elevated p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">
                In Progress
              </p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {stats.statusCounts.Applied +
                  stats.statusCounts["Under Review"]}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Status Breakdown */}
        <div className="lg:col-span-1 card-elevated p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Status Breakdown
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{status}</span>
                <span className="text-sm font-semibold text-foreground">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines Widget */}
        <div className="lg:col-span-2 card-elevated p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Upcoming Deadlines (Next 7 Days)
            </h3>
            <Button
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="text-sm"
            >
              + Add Application
            </Button>
          </div>

          {stats.allUpcomingDeadlines.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                No upcoming deadlines in the next 7 days
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.allUpcomingDeadlines.map((app: any) => (
                <div
                  key={app.id}
                  className="flex items-start justify-between p-3 rounded-lg bg-background/50 hover:bg-background transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">
                        {app.url ? (
                          <a
                            href={app.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary hover:underline transition-colors"
                          >
                            {app.eventName}
                          </a>
                        ) : (
                          app.eventName
                        )}
                      </p>
                      {app.url && (
                        <a
                          href={app.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open event page"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-primary transition-colors" />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {app.eventType} •{" "}
                      {new Date(app.deadline!).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`badge ${getStatusBadgeClass(app.status)}`}>
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card-elevated p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Recent Activity
        </h3>
        {stats.recentActivity.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">
              No applications yet. Start by adding your first one!
            </p>
            <Button onClick={() => setShowAddModal(true)} className="mt-4">
              + Add Application
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.recentActivity.map((app: any) => (
              <div
                key={app.id}
                className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">
                      {app.url ? (
                        <a
                          href={app.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary hover:underline transition-colors"
                        >
                          {app.eventName}
                        </a>
                      ) : (
                        app.eventName
                      )}
                    </p>
                    {app.url && (
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open event page"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-primary transition-colors" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {app.eventType} • Added{" "}
                    {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`badge ${getStatusBadgeClass(app.status)}`}>
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Recommendations */}
      {applications.length > 0 && <RecommendationsPanel />}

      <AddApplicationModal open={showAddModal} onOpenChange={setShowAddModal} />
    </div>
  );
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "Accepted":
      return "badge-success";
    case "Rejected":
    case "Withdrawn":
      return "badge-danger";
    case "Under Review":
      return "badge-warning";
    default:
      return "badge-neutral";
  }
}
