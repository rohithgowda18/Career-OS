import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { placementsApi } from "@/lib/api/placementsApi";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import PlacementTable from "@/components/PlacementTable";
import PlacementKanbanView from "@/components/views/PlacementKanbanView";
import AddPlacementModal from "@/components/AddPlacementModal";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  FileCheck,
  Award,
  Calendar,
  CheckCircle,
  XCircle,
  Plus,
  Briefcase,
  Loader2,
} from "lucide-react";

export default function PlacementsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const analyticsQuery = useQuery({
    queryKey: ["analytics", "placements"],
    queryFn: placementsApi.getAnalytics,
  });

  const stats = useMemo(() => {
    const data = analyticsQuery.data || {};
    return {
      total: data.totalPlacements || 0,
      applied: data.applied || 0,
      assessments: (data.assessmentScheduled || 0) + (data.assessmentCompleted || 0),
      interviews: (data.interviewScheduled || 0) + (data.interviewCompleted || 0),
      offers: data.offerReceived || 0,
      rejected: data.rejected || 0,
    };
  }, [analyticsQuery.data]);

  return (
    <DashboardLayout activeTab="placements">
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Title / Action bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center shadow-lg group hover:border-primary/50 transition-colors">
              <Briefcase className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">Placements</h2>
              <p className="text-xs text-text-muted hidden sm:block uppercase tracking-widest font-bold opacity-60">
                Jobs, Internships, and Campus recruitment funnel
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* View Mode Toggle */}
            <div className="flex gap-1 p-1 border border-border rounded-xl bg-bg-card/40">
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "py-1.5 px-3.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                  viewMode === "table" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-text-muted hover:text-text-main"
                )}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={cn(
                  "py-1.5 px-3.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                  viewMode === "kanban" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-text-muted hover:text-text-main"
                )}
              >
                Kanban
              </button>
            </div>

            <Button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex h-11 px-8 shadow-primary/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Placement
            </Button>
          </div>
        </div>

        {/* Analytics Stats Grid */}
        {analyticsQuery.isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <StatCard
              label="Total Applications"
              value={stats.total}
              icon={<TrendingUp className="w-4 h-4 text-text-muted" />}
              bg="bg-bg-elevated/40"
              color="text-text-main"
            />
            <StatCard
              label="Applied Only"
              value={stats.applied}
              icon={<FileCheck className="w-4 h-4 text-primary" />}
              bg="bg-primary/5"
              color="text-primary"
            />
            <StatCard
              label="Assessments"
              value={stats.assessments}
              icon={<Award className="w-4 h-4 text-amber-500" />}
              bg="bg-amber-500/5"
              color="text-amber-500"
            />
            <StatCard
              label="Interviews"
              value={stats.interviews}
              icon={<Calendar className="w-4 h-4 text-indigo-500" />}
              bg="bg-indigo-500/5"
              color="text-indigo-500"
            />
            <StatCard
              label="Offers"
              value={stats.offers}
              icon={<CheckCircle className="w-4 h-4 text-success" />}
              bg="bg-success/5"
              color="text-success"
            />
            <StatCard
              label="Rejected"
              value={stats.rejected}
              icon={<XCircle className="w-4 h-4 text-danger" />}
              bg="bg-danger/5"
              color="text-danger"
            />
          </div>
        )}

        {/* Data View */}
        {viewMode === "table" ? (
          <PlacementTable page={page} setPage={setPage} pageSize={PAGE_SIZE} />
        ) : (
          <PlacementKanbanView />
        )}

        {/* Add Modal */}
        <AddPlacementModal open={showAddModal} onOpenChange={setShowAddModal} />
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  label,
  value,
  icon,
  bg,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  bg: string;
  color: string;
}) {
  return (
    <div className="card-premium p-5 group flex flex-col justify-between bg-bg-card/30 border-border/60">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[9px] font-black text-text-muted uppercase tracking-wider line-clamp-1">{label}</span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center border border-border/40 group-hover:scale-105 transition-transform ${bg}`}>
          {icon}
        </div>
      </div>
      <p className={`text-2xl font-black tracking-tight tabular-nums ${color}`}>{value}</p>
    </div>
  );
}
