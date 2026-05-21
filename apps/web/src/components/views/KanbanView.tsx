import { useQuery } from "@tanstack/react-query";
import { applicationsApi } from "@/lib/api/applicationsApi";
import { Loader2, Plus, Rocket, Layers, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
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
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [page, setPage] = useState(0);
  const size = 8; // 8 items per page for a nice grid

  // Reset page to 0 when status filter changes
  useEffect(() => {
    setPage(0);
  }, [selectedStatus]);

  // Fetch applications using pure server-side pagination
  const applicationsQuery = useQuery({
    queryKey: ["applications", selectedStatus, page, size],
    queryFn: () => {
      if (selectedStatus === "All") {
        return applicationsApi.list(page, size, "deadline,asc");
      } else {
        return applicationsApi.listByStatus(selectedStatus, page, size, "deadline,asc");
      }
    },
  });

  const pageData = applicationsQuery.data;
  const applications = pageData?.content || [];
  const totalPages = pageData?.totalPages || 0;
  const totalElements = pageData?.totalElements || 0;
  const isFirstPage = pageData?.first ?? true;
  const isLastPage = pageData?.last ?? true;

  if (applicationsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative pb-20 md:pb-0 animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center shadow-lg group hover:border-primary/50 transition-colors">
            <Layers className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">Applications</h2>
            <p className="text-xs text-text-muted hidden sm:block uppercase tracking-widest font-bold opacity-60">Visual Application Journey</p>
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

      {/* Filter control bar */}
      <div className="flex flex-col gap-5 p-5 rounded-[1.5rem] border border-border bg-bg-card/30 shadow-sm backdrop-blur-md">
        
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setSelectedStatus("All")}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all duration-300 flex items-center gap-2",
              selectedStatus === "All"
                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105"
                : "bg-bg-elevated/40 border-border text-text-muted hover:text-text-main hover:border-primary/30"
            )}
          >
            <span>All</span>
          </button>

          {(["Interested", "Applied", "UnderReview", "Accepted", "Rejected"] as const).map((status) => {
            const label = status === "UnderReview" ? "In Review" : status;
            const isSelected = selectedStatus === status;

            return (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all duration-300 flex items-center gap-2",
                  isSelected
                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105"
                    : "bg-bg-elevated/40 border-border text-text-muted hover:text-text-main hover:border-primary/30"
                )}
              >
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Applications Grid / Main Area */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black uppercase tracking-widest text-text-muted">
            {selectedStatus === "UnderReview" ? "In Review" : selectedStatus} Applications ({totalElements})
          </h3>
        </div>

        {applications.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {applications.map((app: any) => (
              <ApplicationCard key={app.id} application={app} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-border/40 rounded-3xl bg-bg-card/10 group animate-in fade-in duration-300">
            <div className="w-14 h-14 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center mb-5 transition-all group-hover:border-primary/30 group-hover:scale-110 shadow-lg">
              <Rocket className="w-7 h-7 text-text-muted/40 group-hover:text-primary transition-colors" />
            </div>
            <h4 className="text-sm font-black text-text-main uppercase tracking-widest mb-1.5">No Applications Found</h4>
            <p className="text-xs text-text-muted max-w-[280px] mx-auto leading-relaxed font-bold">
              No entries exist for this status filter. Get started by clicking 'Add Application' to record your journey! 🚀
            </p>
          </div>
        )}

        {/* Server-Side Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/40 pt-6 px-1">
            <p className="text-xs font-black text-text-muted uppercase tracking-widest">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(prev => Math.max(0, prev - 1))}
                disabled={isFirstPage}
                className="h-9 w-9 p-0 rounded-xl border-border bg-bg-card hover:bg-bg-elevated"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              {/* Dynamic Page Number Buttons */}
              {Array.from({ length: totalPages }, (_, i) => (
                <Button
                  key={i}
                  variant={page === i ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(i)}
                  className={cn(
                    "h-9 w-9 rounded-xl font-bold text-xs",
                    page === i 
                      ? "bg-primary text-white" 
                      : "border-border bg-bg-card hover:bg-bg-elevated text-text-main"
                  )}
                >
                  {i + 1}
                </Button>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={isLastPage}
                className="h-9 w-9 p-0 rounded-xl border-border bg-bg-card hover:bg-bg-elevated"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

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
