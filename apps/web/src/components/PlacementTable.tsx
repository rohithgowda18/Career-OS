import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { placementsApi } from "@/lib/api/placementsApi";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Calendar,
  Globe,
  Loader2,
  MapPin,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import EditPlacementModal from "@/components/EditPlacementModal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PlacementTableProps {
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
}

const STATUS_CLASSES: Record<string, string> = {
  APPLIED: "bg-primary/10 text-primary border-primary/20",
  ASSESSMENT_SCHEDULED: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  ASSESSMENT_COMPLETED: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  INTERVIEW_SCHEDULED: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  INTERVIEW_COMPLETED: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  OFFER_RECEIVED: "bg-success/10 text-success border-success/20",
  REJECTED: "bg-danger/10 text-danger border-danger/20",
};

const STATUS_LABELS: Record<string, string> = {
  APPLIED: "Applied",
  ASSESSMENT_SCHEDULED: "Assessment Scheduled",
  ASSESSMENT_COMPLETED: "Assessment Completed",
  INTERVIEW_SCHEDULED: "Interview Scheduled",
  INTERVIEW_COMPLETED: "Interview Completed",
  OFFER_RECEIVED: "Offer Received",
  REJECTED: "Rejected",
};

export default function PlacementTable({ page, setPage, pageSize }: PlacementTableProps) {
  const [selectedPlacement, setSelectedPlacement] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const queryClient = useQueryClient();

  const placementsQuery = useQuery({
    queryKey: ["placements", { page, size: pageSize, sort: "id,desc" }],
    queryFn: () => placementsApi.list({ page, size: pageSize, sort: "id,desc" }),
  });

  const deleteMutation = useMutation({
    mutationFn: placementsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["placements"] });
      queryClient.invalidateQueries({ queryKey: ["analytics", "placements"] });
      toast.success("Placement deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete placement");
    },
  });

  const handleDelete = (id: number, company: string) => {
    if (window.confirm(`Are you sure you want to delete the placement for ${company}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (placement: any) => {
    setSelectedPlacement(placement);
    setShowEditModal(true);
  };

  const data = placementsQuery.data || {
    content: [],
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
  };

  const placements = data.content || [];
  const totalPages = data.totalPages;

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

  if (placementsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card-premium overflow-hidden p-0 border-border bg-bg-card/20 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-bg-card/60">
                <th className="p-4 text-[10px] font-black uppercase tracking-wider text-text-muted">Company</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-wider text-text-muted">Role</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-wider text-text-muted">Location</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-wider text-text-muted">Stipend</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-wider text-text-muted">CTC</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-wider text-text-muted">Status</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-wider text-text-muted">Assessment</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-wider text-text-muted">Interview</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-wider text-text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {placements.map((p: any) => (
                <tr key={p.id} className="hover:bg-bg-elevated/20 transition-colors group">
                  <td className="p-4 font-bold text-text-main text-sm truncate max-w-[120px]">{p.companyName}</td>
                  <td className="p-4 text-text-muted text-sm font-semibold truncate max-w-[120px]">{p.role}</td>
                  <td className="p-4 text-xs font-semibold text-text-muted">
                    {p.location ? (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 opacity-60" />
                        {p.location}
                      </span>
                    ) : (
                      <span className="opacity-30">-</span>
                    )}
                  </td>
                  <td className="p-4 text-xs font-semibold text-text-muted">
                    {p.stipend ? (
                      <span className="flex items-center gap-1 text-primary">
                        <DollarSign className="w-3 h-3 opacity-80" />
                        {p.stipend}
                      </span>
                    ) : (
                      <span className="opacity-30">-</span>
                    )}
                  </td>
                  <td className="p-4 text-xs font-semibold text-text-muted">
                    {p.ctc ? (
                      <span className="flex items-center gap-1 text-primary">
                        <DollarSign className="w-3 h-3 opacity-80" />
                        {p.ctc}
                      </span>
                    ) : (
                      <span className="opacity-30">-</span>
                    )}
                  </td>
                  <td className="p-4 text-xs">
                    <span className={cn("px-2.5 py-1 rounded-md border font-black uppercase tracking-wider text-[9px]", STATUS_CLASSES[p.status] || "bg-bg-elevated border-border")}>
                      {STATUS_LABELS[p.status] || p.status}
                    </span>
                  </td>

                  <td className="p-4 text-xs font-semibold text-text-muted">
                    {p.assessmentDate ? (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-accent shrink-0" />
                        {format(new Date(p.assessmentDate), "MMM dd, yyyy")}
                      </span>
                    ) : (
                      <span className="opacity-30">-</span>
                    )}
                  </td>
                  <td className="p-4 text-xs font-semibold text-text-muted">
                    {p.interviewDate ? (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-success shrink-0" />
                        {format(new Date(p.interviewDate), "MMM dd, yyyy")}
                      </span>
                    ) : (
                      <span className="opacity-30">-</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {p.applicationLink && (
                        <a
                          href={p.applicationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-8 w-8 text-text-muted hover:text-primary hover:bg-bg-elevated flex items-center justify-center rounded-lg"
                        >
                          <Globe className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(p)}
                        className="h-8 w-8 text-text-muted hover:text-primary hover:bg-bg-elevated"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(p.id, p.companyName)}
                        className="h-8 w-8 text-text-muted hover:text-danger hover:bg-danger/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {placements.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-xs font-bold text-text-muted uppercase tracking-widest opacity-40">
                    No placement opportunities recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end pt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="w-9 h-9 rounded-full border border-border bg-bg-card text-text-muted flex items-center justify-center hover:border-primary hover:text-primary transition-all disabled:opacity-30 disabled:hover:border-border disabled:hover:text-text-muted cursor-pointer active:scale-90"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {getPageNumbers().map((p, idx) => {
              if (p === "...") {
                return (
                  <span key={`ellipsis-${idx}`} className="text-xs font-black text-text-muted/40 px-2 select-none">
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
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="w-9 h-9 rounded-full border border-border bg-bg-card text-text-muted flex items-center justify-center hover:border-primary hover:text-primary transition-all disabled:opacity-30 disabled:hover:border-border disabled:hover:text-text-muted cursor-pointer active:scale-90"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
