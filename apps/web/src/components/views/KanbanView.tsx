import { useQuery } from "@tanstack/react-query";
import { applicationsApi } from "@/lib/api/applicationsApi";
import {
  Loader2,
  Plus,
  Rocket,
  Layers,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import AddApplicationModal from "@/components/AddApplicationModal";
import ApplicationCard from "@/components/ApplicationCard";
import { cn } from "@/lib/utils";

const STATUSES = [
  "Interested",
  "Applied",
  "UnderReview",
  "Accepted",
  "Rejected",
] as const;

export default function KanbanView() {
  const [showAddModal, setShowAddModal] = useState(false);
  const PAGE_SIZE = 6;
  const [page, setPage] = useState(0);

  // Backend pagination with sorting: sort by deadline ascending (earliest/most urgent first)
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

  const columnData = useMemo(() => {
    return STATUSES.map(status => ({
      status,
      applications: applications.filter((app: any) => app.status === status),
    }));
  }, [applications]);

  if (applicationsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (applicationsQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-3xl bg-danger/10 flex items-center justify-center mb-6">
          <Layers className="w-8 h-8 text-danger" />
        </div>
        <h3 className="text-xl font-black text-text-main">Pipeline Interrupted</h3>
        <p className="text-xs text-text-muted mt-3 uppercase tracking-widest font-bold opacity-60">
          {(applicationsQuery.error as any)?.message || "Connectivity issue detected"}
        </p>
        <Button 
          onClick={() => applicationsQuery.refetch()} 
          variant="outline" 
          className="mt-8 border-border hover:bg-bg-elevated font-black text-[10px] uppercase tracking-widest h-11 px-8"
        >
          Re-establish Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative pb-20 md:pb-0 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center shadow-lg group hover:border-primary/50 transition-colors">
            <Layers className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">
              All Applications
            </h2>
            <p className="text-xs text-text-muted hidden sm:block uppercase tracking-widest font-bold opacity-60">
              Complete Overview of your submissions
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="btn-primary hidden md:flex h-11 px-8 shadow-primary/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Application
        </Button>
      </div>

      {totalElements === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border/40 rounded-3xl bg-bg-elevated/5 group">
          <div className="w-16 h-16 rounded-[1.5rem] bg-bg-elevated border border-border flex items-center justify-center mb-6 transition-all group-hover:border-primary/30 group-hover:scale-110">
            <Rocket className="w-8 h-8 text-text-muted/20" />
          </div>
          <p className="text-sm font-black text-text-muted uppercase tracking-widest mb-2">
            No Applications Yet
          </p>
          <p className="text-xs text-text-muted/50 font-bold max-w-[200px] mx-auto leading-relaxed">
            Click 'Add Application' to get started 🚀
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {applications.map((app: any) => (
              <ApplicationCard key={app.id} application={app} />
            ))}
          </div>

          {/* Simple Premium Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end pt-6 border-t border-border mt-8">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="w-9 h-9 rounded-full border border-border bg-bg-card text-text-muted flex items-center justify-center hover:border-primary hover:text-primary transition-all disabled:opacity-30 disabled:hover:border-border disabled:hover:text-text-muted cursor-pointer active:scale-90"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {getPageNumbers().map((p, idx) => {
                  if (p === "...") {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        className="text-xs font-black text-text-muted/40 px-2 select-none"
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
                        "w-9 h-9 rounded-full text-xs font-black transition-all cursor-pointer flex items-center justify-center border active:scale-90",
                        isCurrent
                          ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                          : "border-border bg-bg-card text-text-muted hover:border-primary/50 hover:text-text-main"
                      )}
                    >
                      {(p as number) + 1}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="w-9 h-9 rounded-full border border-border bg-bg-card text-text-muted flex items-center justify-center hover:border-primary hover:text-primary transition-all disabled:opacity-30 disabled:hover:border-border disabled:hover:text-text-muted cursor-pointer active:scale-90"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Floating Action Button for Mobile */}
      <Button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-24 right-6 w-16 h-16 rounded-full shadow-2xl shadow-primary/40 bg-primary hover:bg-primary-hover p-0 md:hidden z-50 animate-in fade-in zoom-in duration-300 active:scale-90"
      >
        <Plus className="w-7 h-7 text-white" />
      </Button>

      <AddApplicationModal open={showAddModal} onOpenChange={setShowAddModal} />
    </div>
  );
}
