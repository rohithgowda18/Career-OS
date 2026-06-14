import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { placementsApi } from "@/lib/api/placementsApi";
import { format } from "date-fns";
import {
  Calendar,
  Briefcase,
  MapPin,
  DollarSign,
  Loader2,
  FileCheck,
  CheckCircle,
  XCircle,
  Award,
} from "lucide-react";
import EditPlacementModal from "@/components/EditPlacementModal";
import { cn, formatDateForBackend } from "@/lib/utils";
import { toast } from "sonner";

const COLUMNS = [
  { id: "APPLIED", label: "Applied", statuses: ["APPLIED"], color: "border-primary/20 text-primary bg-primary/[0.02]", icon: <FileCheck className="w-3.5 h-3.5" /> },
  { id: "ASSESSMENT_SCHEDULED", label: "Assessment", statuses: ["ASSESSMENT_SCHEDULED", "ASSESSMENT_COMPLETED"], color: "border-amber-500/20 text-amber-500 bg-amber-500/[0.02]", icon: <Award className="w-3.5 h-3.5" /> },
  { id: "INTERVIEW_SCHEDULED", label: "Interview", statuses: ["INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED"], color: "border-indigo-500/20 text-indigo-500 bg-indigo-500/[0.02]", icon: <Calendar className="w-3.5 h-3.5" /> },
  { id: "OFFER_RECEIVED", label: "Offer", statuses: ["OFFER_RECEIVED"], color: "border-success/20 text-success bg-success/[0.02]", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  { id: "REJECTED", label: "Rejected", statuses: ["REJECTED"], color: "border-danger/20 text-danger bg-danger/[0.02]", icon: <XCircle className="w-3.5 h-3.5" /> },
];

export default function PlacementKanbanView() {
  const [selectedPlacement, setSelectedPlacement] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const queryClient = useQueryClient();

  const placementsQuery = useQuery({
    queryKey: ["placements", { page: 0, size: 100, sort: "id,desc" }],
    queryFn: () => placementsApi.list({ page: 0, size: 100, sort: "id,desc" }),
  });

  const updateMutation = useMutation({
    mutationFn: placementsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["placements"] });
      queryClient.invalidateQueries({ queryKey: ["analytics", "placements"] });
      toast.success("Placement status updated");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update placement status");
    },
  });

  const handleDragStart = (e: React.DragEvent, id: string | number) => {
    e.dataTransfer.setData("text/plain", id.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const placement = placementsQuery.data?.content?.find((p: any) => p.id.toString() === id);
    if (!placement) return;
    if (placement.status === targetStatus) return;

    updateMutation.mutate({
      id: placement.id,
      companyName: placement.companyName,
      role: placement.role,
      location: placement.location,
      stipend: placement.stipend,
      ctc: placement.ctc,
      applicationLink: placement.applicationLink,
      assessmentDate: formatDateForBackend(placement.assessmentDate),
      interviewDate: formatDateForBackend(placement.interviewDate),
      status: targetStatus,
    });
  };

  if (placementsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const placements = placementsQuery.data?.content || [];

  return (
    <div className="space-y-6">
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-border min-h-[550px] items-start">
        {COLUMNS.map((column) => {
          const columnPlacements = placements.filter((p: any) =>
            column.statuses.includes(p.status)
          );

          return (
            <div
              key={column.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
              className="flex-1 min-w-[260px] max-w-[300px] bg-bg-card border border-border rounded-xl p-3 flex flex-col gap-3 self-stretch min-h-[480px]"
            >
              {/* Column Header */}
              <div className={cn("flex items-center justify-between p-2.5 rounded-lg border text-[11px] font-semibold uppercase tracking-wider", column.color)}>
                <div className="flex items-center gap-1.5">
                  {column.icon}
                  <span>{column.label}</span>
                </div>
                <span className="bg-bg-elevated/85 text-text-muted px-2 py-0.5 rounded-full text-[10px] font-semibold">
                  {columnPlacements.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto max-h-[450px] pr-0.5 scrollbar-thin">
                {columnPlacements.map((placement: any) => (
                  <div
                    key={placement.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, placement.id)}
                    onClick={() => {
                      setSelectedPlacement(placement);
                      setShowEditModal(true);
                    }}
                    className="card-premium p-3.5 bg-bg-main border border-border/80 hover:border-primary/30 cursor-grab active:cursor-grabbing transition-all space-y-2.5 group"
                  >
                    <div>
                      <h4 className="text-xs font-semibold text-text-main group-hover:text-primary transition-colors line-clamp-1">
                        {placement.companyName}
                      </h4>
                      <p className="text-[10px] font-medium text-text-muted flex items-center gap-1 mt-0.5">
                        <Briefcase className="w-3.5 h-3.5 text-text-dim shrink-0" />
                        <span>{placement.role}</span>
                      </p>
                    </div>

                    {(placement.location || placement.stipend || placement.ctc) && (
                      <div className="space-y-1 pt-2 border-t border-border/40 text-[10px] font-medium text-text-muted">
                        {placement.location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-text-dim" />
                            <span>{placement.location}</span>
                          </div>
                        )}
                        {placement.stipend && (
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5 text-primary" />
                            <span>Stipend: {placement.stipend}</span>
                          </div>
                        )}
                        {placement.ctc && (
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5 text-primary" />
                            <span>CTC: {placement.ctc}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {(placement.assessmentDate || placement.interviewDate) && (
                      <div className="space-y-0.5 pt-2 border-t border-border/40 text-[9px] font-semibold uppercase tracking-wider text-text-dim">
                        {placement.assessmentDate && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-warning shrink-0" />
                            <span>Assess: {format(new Date(placement.assessmentDate), "MMM dd")}</span>
                          </div>
                        )}
                        {placement.interviewDate && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span>Interview: {format(new Date(placement.interviewDate), "MMM dd")}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {columnPlacements.length === 0 && (
                  <div className="text-center py-6 text-[9px] font-medium text-text-dim uppercase tracking-wider border border-dashed border-border/50 rounded-lg">
                    Drop items here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedPlacement && (
        <EditPlacementModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          placementId={selectedPlacement.id}
          initialData={selectedPlacement}
        />
      )}
    </div>
  );
}
