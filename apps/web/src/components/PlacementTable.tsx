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
  DollarSign,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import EditPlacementModal from "@/components/EditPlacementModal";
import AddPlacementModal from "@/components/AddPlacementModal";
import PlacementCard from "@/components/PlacementCard";
import EmptyState from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { Badge } from "@/components/ui/badge";

interface PlacementTableProps {
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
}

const STATUS_CLASSES: Record<string, string> = {
  APPLIED: "bg-primary/10 text-primary border-primary/20",
  ASSESSMENT_SCHEDULED: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  ASSESSMENT_COMPLETED: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  INTERVIEW_SCHEDULED: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  INTERVIEW_COMPLETED: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  OFFER_RECEIVED: "bg-success/10 text-success border-success/20",
  REJECTED: "bg-danger/10 text-danger border-danger/20",
};

const STATUS_LABELS: Record<string, string> = {
  APPLIED: "Applied",
  ASSESSMENT_SCHEDULED: "Assess Scheduled",
  ASSESSMENT_COMPLETED: "Assess Done",
  INTERVIEW_SCHEDULED: "Interview Scheduled",
  INTERVIEW_COMPLETED: "Interview Done",
  OFFER_RECEIVED: "Offer Received",
  REJECTED: "Rejected",
};

export default function PlacementTable({ page, setPage, pageSize }: PlacementTableProps) {
  const { themeTokens } = useTheme();
  const [selectedPlacement, setSelectedPlacement] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
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
      toast.success("Placement opportunity deleted");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete placement opportunity");
    },
  });

  const handleDelete = (id: number, company: string) => {
    if (window.confirm(`Are you sure you want to delete the placement opportunity for ${company}?`)) {
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

  if (placements.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyState
          title="No Placements"
          description="You haven't logged any placement opportunities yet. Add job offers, internships, and recruiter contacts to start your pipeline."
          icon={Briefcase}
          actionLabel="Add Placement"
          onAction={() => setShowAddModal(true)}
        />
        <AddPlacementModal open={showAddModal} onOpenChange={setShowAddModal} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mobile viewports list display */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {placements.map((p: any) => (
          <PlacementCard
            key={p.id}
            placement={p}
            onEdit={() => handleEdit(p)}
            onDelete={() => handleDelete(p.id, p.companyName)}
          />
        ))}
        {placements.length === 0 && (
          <div className="border border-dashed border-border/60 rounded-xl p-8 text-center text-xs text-text-dim">
            No placement opportunities recorded yet
          </div>
        )}
      </div>

      {/* Desktop data table display */}
      <div className={cn("overflow-hidden hidden md:block", themeTokens.card)}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={themeTokens.tableHeaderClass}>
                <th className="p-3 text-[11px] font-semibold uppercase tracking-wider text-text-dim">Company</th>
                <th className="p-3 text-[11px] font-semibold uppercase tracking-wider text-text-dim">Role</th>
                <th className="p-3 text-[11px] font-semibold uppercase tracking-wider text-text-dim">Location</th>
                <th className="p-3 text-[11px] font-semibold uppercase tracking-wider text-text-dim">Stipend</th>
                <th className="p-3 text-[11px] font-semibold uppercase tracking-wider text-text-dim">CTC</th>
                <th className="p-3 text-[11px] font-semibold uppercase tracking-wider text-text-dim">Status</th>
                <th className="p-3 text-[11px] font-semibold uppercase tracking-wider text-text-dim">Assessment</th>
                <th className="p-3 text-[11px] font-semibold uppercase tracking-wider text-text-dim">Interview</th>
                <th className="p-3 text-[11px] font-semibold uppercase tracking-wider text-text-dim text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {placements.map((p: any) => (
                <tr key={p.id} className={cn("transition-colors group", themeTokens.tableRowClass)}>
                  <td className={cn("p-3 font-semibold text-xs truncate max-w-[120px]", themeTokens.headingColor)}>{p.companyName}</td>
                  <td className={cn("p-3 text-xs truncate max-w-[120px]", themeTokens.textColor)}>{p.role}</td>
                  <td className="p-3 text-xs text-text-muted">
                    {p.location ? (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-text-dim shrink-0" />
                        {p.location}
                      </span>
                    ) : (
                      <span className="text-text-dim/40">-</span>
                    )}
                  </td>
                  <td className="p-3 text-xs text-text-muted">
                    {p.stipend ? (
                      <span className="flex items-center gap-1 text-primary">
                        <DollarSign className="w-3 h-3 text-text-dim shrink-0" />
                        {p.stipend}
                      </span>
                    ) : (
                      <span className="text-text-dim/40">-</span>
                    )}
                  </td>
                  <td className="p-3 text-xs text-text-muted">
                    {p.ctc ? (
                      <span className="flex items-center gap-1 text-primary">
                        <DollarSign className="w-3 h-3 text-text-dim shrink-0" />
                        {p.ctc}
                      </span>
                    ) : (
                      <span className="text-text-dim/40">-</span>
                    )}
                  </td>
                  <td className="p-3 text-xs">
                    <Badge
                      statusColor={
                        p.status === "OFFER_RECEIVED"
                          ? "green"
                          : p.status === "REJECTED"
                          ? "red"
                          : p.status.includes("SCHEDULED") || p.status.includes("COMPLETED")
                          ? "orange"
                          : "blue"
                      }
                      className="text-[10px]"
                    >
                      {STATUS_LABELS[p.status] || p.status}
                    </Badge>
                  </td>

                  <td className="p-3 text-xs text-text-muted">
                    {p.assessmentDate ? (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-warning shrink-0" />
                        {format(new Date(p.assessmentDate), "MMM dd")}
                      </span>
                    ) : (
                      <span className="text-text-dim/40">-</span>
                    )}
                  </td>
                  <td className="p-3 text-xs text-text-muted">
                    {p.interviewDate ? (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-success shrink-0" />
                        {format(new Date(p.interviewDate), "MMM dd")}
                      </span>
                    ) : (
                      <span className="text-text-dim/40">-</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-75 group-hover:opacity-100 transition-opacity">
                      {p.applicationLink && (
                        <a
                          href={p.applicationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-8 w-8 text-text-dim hover:text-primary hover:bg-bg-elevated flex items-center justify-center rounded-lg"
                        >
                          <Globe className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(p)}
                        className="h-8 w-8 text-text-dim hover:text-primary hover:bg-bg-elevated"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(p.id, p.companyName)}
                        className="h-8 w-8 text-text-dim hover:text-danger hover:bg-danger/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {placements.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-xs text-text-dim">
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
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="w-8 h-8 rounded-lg border border-border bg-bg-card text-text-muted flex items-center justify-center hover:border-border/80 hover:text-text-main transition-all disabled:opacity-35 cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {getPageNumbers().map((p, idx) => {
              if (p === "...") {
                return (
                  <span key={`ellipsis-${idx}`} className="text-xs font-semibold text-text-dim px-1.5 select-none">
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
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="w-8 h-8 rounded-lg border border-border bg-bg-card text-text-muted flex items-center justify-center hover:border-border/80 hover:text-text-main transition-all disabled:opacity-35 cursor-pointer active:scale-95"
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
