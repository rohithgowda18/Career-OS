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
  AlertCircle,
  FileCheck,
  CheckCircle,
  XCircle,
  Award,
} from "lucide-react";
import EditPlacementModal from "@/components/EditPlacementModal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const COLUMNS = [
  { id: "APPLIED", label: "Applied", statuses: ["APPLIED"], color: "border-primary/30 text-primary bg-primary/5", icon: <FileCheck className="w-4 h-4" /> },
  { id: "ASSESSMENT_SCHEDULED", label: "Assessment Scheduled", statuses: ["ASSESSMENT_SCHEDULED", "ASSESSMENT_COMPLETED"], color: "border-amber-500/30 text-amber-500 bg-amber-500/5", icon: <Award className="w-4 h-4" /> },
  { id: "INTERVIEW_SCHEDULED", label: "Interview Scheduled", statuses: ["INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED"], color: "border-indigo-500/30 text-indigo-500 bg-indigo-500/5", icon: <Calendar className="w-4 h-4" /> },
  { id: "OFFER_RECEIVED", label: "Offer Received", statuses: ["OFFER_RECEIVED"], color: "border-success/30 text-success bg-success/5", icon: <CheckCircle className="w-4 h-4" /> },
  { id: "REJECTED", label: "Rejected", statuses: ["REJECTED"], color: "border-danger/30 text-danger bg-danger/5", icon: <XCircle className="w-4 h-4" /> },
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
      toast.error(err.message || "Failed to update status");
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

    // Call update API with updated status
    updateMutation.mutate({
      id: placement.id,
      companyName: placement.companyName,
      role: placement.role,
      location: placement.location,
      stipend: placement.stipend,
      ctc: placement.ctc,
      applicationLink: placement.applicationLink,
      assessmentDate: placement.assessmentDate ? new Date(placement.assessmentDate) : undefined,
      interviewDate: placement.interviewDate ? new Date(placement.interviewDate) : undefined,
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
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-border min-h-[600px] items-start">
        {COLUMNS.map((column) => {
          const columnPlacements = placements.filter((p: any) =>
            column.statuses.includes(p.status)
          );

          return (
            <div
              key={column.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
              className="flex-1 min-w-[280px] max-w-[320px] bg-bg-card/20 border border-border/80 rounded-2xl p-4 flex flex-col gap-4 self-stretch min-h-[500px]"
            >
              {/* Column Header */}
              <div className={cn("flex items-center justify-between p-3 rounded-xl border text-[10px] font-black uppercase tracking-widest", column.color)}>
                <div className="flex items-center gap-1.5">
                  {column.icon}
                  <span>{column.label}</span>
                </div>
                <span className="bg-bg-elevated text-text-muted px-2 py-0.5 rounded-full text-[9px] font-black">
                  {columnPlacements.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[500px] pr-1 scrollbar-thin">
                {columnPlacements.map((placement: any) => (
                  <div
                    key={placement.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, placement.id)}
                    onClick={() => {
                      setSelectedPlacement(placement);
                      setShowEditModal(true);
                    }}
                    className="card-premium p-4 bg-bg-card/45 border-border/60 hover:border-primary/40 hover:bg-bg-elevated/20 cursor-grab active:cursor-grabbing transition-all space-y-3 group"
                  >
                    <div>
                      <h4 className="text-sm font-black text-text-main group-hover:text-primary transition-colors line-clamp-1">
                        {placement.companyName}
                      </h4>
                      <p className="text-[10px] font-bold text-text-muted/80 flex items-center gap-1 mt-1">
                        <Briefcase className="w-3 h-3 opacity-60" />
                        {placement.role}
                      </p>
                    </div>

                    {/* Show only fields that contain values, no empty labels */}
                    {(placement.location || placement.stipend || placement.ctc) && (
                      <div className="space-y-1.5 pt-1.5 border-t border-border/20 text-[11px] font-semibold text-text-muted">
                        {placement.location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 opacity-55 text-text-muted" />
                            <span>{placement.location}</span>
                          </div>
                        )}
                        {placement.stipend && (
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5 opacity-55 text-primary" />
                            <span>Stipend: {placement.stipend}</span>
                          </div>
                        )}
                        {placement.ctc && (
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5 opacity-55 text-primary" />
                            <span>CTC: {placement.ctc}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Dates */}
                    {(placement.assessmentDate || placement.interviewDate) && (
                      <div className="space-y-1 pt-1.5 border-t border-border/20 text-[9px] font-black uppercase tracking-widest text-text-muted/80">
                        {placement.assessmentDate && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-amber-500 shrink-0" />
                            <span>Assess: {format(new Date(placement.assessmentDate), "MMM dd")}</span>
                          </div>
                        )}
                        {placement.interviewDate && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span>Interview: {format(new Date(placement.interviewDate), "MMM dd")}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {columnPlacements.length === 0 && (
                  <div className="text-center py-8 text-[9px] font-bold text-text-muted/30 uppercase tracking-widest border border-dashed border-border/40 rounded-xl">
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
