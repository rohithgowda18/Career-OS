import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { placementsApi } from "@/lib/api/placementsApi";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import PlacementTable from "@/components/PlacementTable";
import AddPlacementModal from "@/components/AddPlacementModal";
import { cn } from "@/lib/utils";
import {
  Plus,
  Briefcase,
  Loader2,
  TableProperties
} from "lucide-react";

export default function PlacementsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
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
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Title / Action bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-bg-elevated border border-border flex items-center justify-center">
              <Briefcase className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Placements</h2>
              <p className="text-xs text-text-dim hidden sm:block mt-0.5">
                Jobs, Internship pipelines, and recruitment workflows
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <Button
              onClick={() => setShowAddModal(true)}
              className="btn-primary h-9 px-4"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Placement
            </Button>
          </div>
        </div>

        {/* Quiet, Minimal KPI Indicators Row (Workflow-first style, replaces large widgets) */}
        {analyticsQuery.isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-text-muted border-b border-border/40 pb-4">
            <span className="flex items-center gap-1.5">
              Total Opportunities: <strong className="text-text-main font-semibold">{stats.total}</strong>
            </span>
            <span className="text-text-dim/40">•</span>
            <span className="flex items-center gap-1.5">
              Applied: <strong className="text-text-main font-semibold">{stats.applied}</strong>
            </span>
            <span className="text-text-dim/40">•</span>
            <span className="flex items-center gap-1.5">
              Assessments: <strong className="text-text-main font-semibold">{stats.assessments}</strong>
            </span>
            <span className="text-text-dim/40">•</span>
            <span className="flex items-center gap-1.5">
              Interviews: <strong className="text-text-main font-semibold">{stats.interviews}</strong>
            </span>
            <span className="text-text-dim/40">•</span>
            <span className="flex items-center gap-1.5">
              Offers: <strong className="text-success font-semibold">{stats.offers} 🎉</strong>
            </span>
          </div>
        )}

        {/* Data View */}
        <PlacementTable page={page} setPage={setPage} pageSize={PAGE_SIZE} />

        {/* Add Modal */}
        <AddPlacementModal open={showAddModal} onOpenChange={setShowAddModal} />
      </div>
    </DashboardLayout>
  );
}
