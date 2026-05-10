import { useQuery } from "@tanstack/react-query";
import { applicationsApi } from "@/lib/api/applicationsApi";
import { Loader2, Plus, Rocket, Layers } from "lucide-react";
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
  const applicationsQuery = useQuery({
    queryKey: ["applications"],
    queryFn: applicationsApi.list,
  });
  const applications = Array.isArray(applicationsQuery.data) ? applicationsQuery.data : [];

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
              <h2 className="text-2xl font-black tracking-tight">Pipeline</h2>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {columnData.map(column => (
          <div
            key={column.status}
            className="flex flex-col rounded-[1.5rem] border border-border bg-bg-card/40 min-w-0 shadow-sm"
          >
            {/* Column Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-bg-card/20">
              <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-text-muted">
                {column.status === "UnderReview" ? "In Review" : column.status}
              </h3>
              <div className="px-2.5 py-1 rounded-lg bg-bg-elevated border border-border text-[10px] font-black text-primary tabular-nums shadow-inner">
                {column.applications.length}
              </div>
            </div>

            {/* Column Content */}
            <div className="p-3.5 space-y-5 min-h-[200px] md:min-h-[600px] bg-gradient-to-b from-transparent to-bg-card/10">
              {column.applications.map((app: any) => (
                <ApplicationCard key={app.id} application={app} />
              ))}

              {column.applications.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-border/40 rounded-3xl bg-bg-elevated/5 group">
                  <div className="w-12 h-12 rounded-[1.25rem] bg-bg-elevated border border-border flex items-center justify-center mb-5 transition-all group-hover:border-primary/30 group-hover:scale-110">
                    <Rocket className="w-6 h-6 text-text-muted/20" />
                  </div>
                  <p className="text-[11px] font-black text-text-muted/60 uppercase tracking-widest mb-1">No Applications</p>
                  <p className="text-[9px] text-text-muted/30 font-bold max-w-[140px] mx-auto leading-relaxed">Click 'Add Application' to get started 🚀</p>
                </div>
              )}
            </div>
          </div>
        ))}
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
