import { useQuery } from "@tanstack/react-query";
import { applicationsApi } from "@/lib/api/applicationsApi";
import {
  Loader2,
  Plus,
  Compass,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Calendar,
  AlertTriangle,
  Layers
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import AddApplicationModal from "@/components/AddApplicationModal";
import ApplicationCard from "@/components/ApplicationCard";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useTheme } from "@/contexts/ThemeContext";
import { Badge } from "@/components/ui/badge";

const STATUSES = [
  "Interested",
  "Applied",
  "UnderReview",
  "Accepted",
  "Rejected",
] as const;

const STATUS_BADGE_CLASSES: Record<string, string> = {
  Interested: "bg-bg-elevated text-text-muted border-border",
  Applied: "bg-primary/10 text-primary border-primary/20",
  UnderReview: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Accepted: "bg-success/10 text-success border-success/20",
  Rejected: "bg-danger/10 text-danger border-danger/20",
};

export default function KanbanView() {
  const { themeTokens } = useTheme();
  const [showAddModal, setShowAddModal] = useState(false);
  const PAGE_SIZE = 8;
  const [page, setPage] = useState(0);

  // Fetch applications list
  const applicationsQuery = useQuery({
    queryKey: ["applications", { page, size: PAGE_SIZE, sort: "deadline,asc" }],
    queryFn: () =>
      applicationsApi.list({ page, size: PAGE_SIZE, sort: "deadline,asc" }),
  });

  const applicationsData = applicationsQuery.data || {
    content: [],
    totalElements: 0,
    totalPages: 0,
  };
  const applications = applicationsData.content || [];
  const totalElements = applicationsData.totalElements || 0;
  const totalPages = applicationsData.totalPages || 0;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 4) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
      pages.push(0);
      if (page <= 1) {
        pages.push(1);
        pages.push("...");
        pages.push(totalPages - 1);
      } else if (page >= totalPages - 2) {
        pages.push("...");
        pages.push(totalPages - 2);
        pages.push(totalPages - 1);
      } else {
        pages.push("...");
        pages.push(page);
        pages.push("...");
        pages.push(totalPages - 1);
      }
    }
    return pages;
  };

  if (applicationsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (applicationsQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-12 h-12 rounded-xl bg-danger/10 flex items-center justify-center mb-4">
          <AlertTriangle className="w-5 h-5 text-danger" />
        </div>
        <h3 className="text-sm font-semibold text-text-main">Pipeline Connection Error</h3>
        <p className="text-xs text-text-dim mt-1.5 uppercase tracking-wider">
          {(applicationsQuery.error as any)?.message || "Failed to load applications"}
        </p>
        <Button 
          onClick={() => applicationsQuery.refetch()} 
          variant="outline" 
          className="mt-4 border-border hover:bg-bg-elevated font-semibold text-xs h-9 px-4"
        >
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative pb-20 md:pb-0 animate-in fade-in duration-300">
      <div className="flex items-center justify-between border-b border-border/60 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-bg-elevated border border-border flex items-center justify-center">
            <Layers className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Applications</h2>
            <p className="text-xs text-text-dim hidden sm:block mt-0.5">
              Personal funnel containing hackathons, internship applications, and events
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="btn-primary h-9.5 px-4"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Application
        </Button>
      </div>

      {totalElements === 0 ? (
        <EmptyState
          title="No Applications"
          description="Your pipeline workspace is empty. Begin logging your internship and event applications to track your process."
          icon={Layers}
          actionLabel="Add Application"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <>
          {/* Desktop Table/List Hybrid View */}
          <div className={cn("hidden md:block overflow-hidden", themeTokens.card)}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={themeTokens.tableHeaderClass}>
                    <th className="p-3 text-[11px] font-semibold text-text-dim uppercase tracking-wider">Event / Company</th>
                    <th className="p-3 text-[11px] font-semibold text-text-dim uppercase tracking-wider">Category</th>
                    <th className="p-3 text-[11px] font-semibold text-text-dim uppercase tracking-wider">Status</th>
                    <th className="p-3 text-[11px] font-semibold text-text-dim uppercase tracking-wider">Deadline</th>
                    <th className="p-3 text-[11px] font-semibold text-text-dim uppercase tracking-wider">Notes</th>
                    <th className="p-3 text-[11px] font-semibold text-text-dim uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {applications.map((app: any) => {
                    const dl = app.deadline ? new Date(app.deadline) : null;
                    const isUrgent = dl && dl.getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;
                    
                    return (
                      <tr key={app.id} className={cn("transition-colors group", themeTokens.tableRowClass)}>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className={cn("font-semibold text-xs", themeTokens.headingColor)}>{app.eventName}</span>
                            {app.url && (
                              <a
                                href={app.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-text-dim hover:text-primary transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className={cn("p-3 text-xs", themeTokens.textColor)}>{app.eventType}</td>
                        <td className="p-3 text-xs">
                          <Badge
                            statusColor={
                              app.status === "Accepted"
                                ? "green"
                                : app.status === "Rejected"
                                ? "red"
                                : app.status === "UnderReview"
                                ? "orange"
                                : app.status === "Applied"
                                ? "blue"
                                : "gray"
                            }
                            className="text-[10px]"
                          >
                            {app.status === "UnderReview" ? "In Review" : app.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-xs">
                          {dl ? (
                            <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] uppercase font-semibold", isUrgent ? "bg-danger/10 border-danger/25 text-danger" : "bg-bg-elevated text-text-muted border-border")}>
                              <Calendar className="w-3 h-3" />
                              <span>{format(dl, "MMM dd, yyyy")}</span>
                            </div>
                          ) : (
                            <span className="text-text-dim/55 italic">No deadline</span>
                          )}
                        </td>
                        <td className="p-3 text-xs text-text-dim truncate max-w-xs">{app.notes || "-"}</td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end opacity-75 group-hover:opacity-100 transition-opacity">
                            {/* Reuse ApplicationCard component to wrap menu buttons, preventing redundant modal/delete handler definitions */}
                            <ApplicationCard application={app} inlineOnly />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card Grid View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {applications.map((app: any) => (
              <ApplicationCard key={app.id} application={app} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end pt-4">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="w-8 h-8 rounded-lg border border-border bg-bg-card text-text-muted flex items-center justify-center hover:border-border/80 hover:text-text-main transition-all disabled:opacity-35 cursor-pointer active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {getPageNumbers().map((p, idx) => {
                  if (p === "...") {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        className="text-xs font-semibold text-text-dim px-1.5 select-none"
                      >
                        ...
                      </span>
                    );
                  }

                  const isCurrent = p === page;
                  return (
                    <button
                      key={`page-${p}`}
                      onClick={() => setPage(p as number)}
                      className={cn(
                        "w-8 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center border",
                        isCurrent
                          ? "bg-primary text-white border-primary"
                          : "border-border bg-bg-card text-text-muted hover:border-border/80 hover:text-text-main"
                      )}
                    >
                      {(p as number) + 1}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="w-8 h-8 rounded-lg border border-border bg-bg-card text-text-muted flex items-center justify-center hover:border-border/80 hover:text-text-main transition-all disabled:opacity-35 cursor-pointer active:scale-95"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}



      <AddApplicationModal open={showAddModal} onOpenChange={setShowAddModal} />
    </div>
  );
}
