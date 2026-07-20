import { Application } from "@/types/types";
import {
  MoreVertical,
  ExternalLink,
  Trash2,
  Edit2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { applicationsApi } from "@/lib/api/applicationsApi";
import { toast } from "sonner";
import { useState } from "react";
import AddApplicationModal from "./AddApplicationModal";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ApplicationCardProps {
  application: Application;
  inlineOnly?: boolean;
}

const STATUSES = [
  "Interested",
  "Applied",
  "UnderReview",
  "Accepted",
  "Rejected",
] as const;

export default function ApplicationCard({ application, inlineOnly = false }: ApplicationCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: applicationsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["analytics", "dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["analytics", "applications"] });
      toast.success("Status updated successfully");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const deleteMutation = useMutation({
    mutationFn: applicationsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["analytics", "dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["analytics", "applications"] });
      toast.success("Application deleted successfully");
    },
    onError: () => toast.error("Failed to delete application"),
  });

  const handleStatusChange = (newStatus: string) => {
    updateMutation.mutate({ ...application, status: newStatus as any });
  };

  const deadlineDate = application.deadline
    ? new Date(application.deadline)
    : null;
  const isUrgent =
    deadlineDate &&
    deadlineDate.getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;

  if (inlineOnly) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg hover:bg-bg-elevated cursor-pointer"
            >
              <MoreVertical className="w-4 h-4 text-text-dim" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-bg-card border-border text-text-main shadow-lg"
          >
            <DropdownMenuItem
              onClick={() => setShowEditModal(true)}
              className="hover:bg-bg-elevated cursor-pointer font-semibold text-xs py-2 px-3"
            >
              <Edit2 className="w-3.5 h-3.5 mr-2 text-text-dim" /> Modify Entry
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                if (window.confirm("Are you sure you want to delete this application?")) {
                  deleteMutation.mutate(application.id);
                }
              }}
              className="text-danger hover:bg-danger/10 cursor-pointer font-semibold text-xs py-2 px-3"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AddApplicationModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          applicationId={application.id}
          initialData={application}
        />
      </>
    );
  }

  return (
    <>
      <div className="group relative rounded-xl border border-border bg-bg-card p-4.5 transition-all duration-200 hover:border-border/80">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-xs text-text-main group-hover:text-primary transition-colors truncate">
              {application.eventName}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-text-muted font-medium bg-bg-elevated/50 px-2 py-0.5 rounded border border-border">
                {application.eventType}
              </span>
              {application.url && (
                <a
                  href={application.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-dim hover:text-text-muted transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg hover:bg-bg-elevated"
              >
                <MoreVertical className="w-4 h-4 text-text-dim" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-bg-card border-border text-text-main shadow-lg"
            >
              <DropdownMenuItem
                onClick={() => setShowEditModal(true)}
                className="hover:bg-bg-elevated cursor-pointer font-semibold text-xs py-2 px-3"
              >
                <Edit2 className="w-3.5 h-3.5 mr-2 text-text-dim" /> Modify Entry
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this application?")) {
                    deleteMutation.mutate(application.id);
                  }
                }}
                className="text-danger hover:bg-danger/10 cursor-pointer font-semibold text-xs py-2 px-3"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Item
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {deadlineDate ? (
          <div
            className={cn(
              "flex items-center gap-2 mb-3 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold uppercase tracking-wider",
              isUrgent
                ? "bg-danger/10 border-danger/25 text-danger"
                : "bg-bg-elevated text-text-muted border-border"
            )}
          >
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{format(deadlineDate, "MMM d, yyyy")}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-3 px-2.5 py-1.5 rounded-lg border bg-bg-elevated/40 border-border/40 text-text-dim text-[11px] font-medium italic">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0 opacity-40" />
            <span>No deadline set</span>
          </div>
        )}

        {application.notes && (
          <p className="text-[11px] text-text-muted/80 mb-4 line-clamp-2 leading-relaxed border-l border-border pl-2.5 italic">
            "{application.notes}"
          </p>
        )}

        <div className="flex items-center gap-2 pt-3 border-t border-border/40">
          <Select
            value={application.status}
            onValueChange={handleStatusChange}
            disabled={updateMutation.isPending}
          >
            {/* Set touch target height to 44px min for thumb friendliness on mobile */}
            <SelectTrigger className="h-10 text-[10px] font-semibold uppercase tracking-wider bg-bg-elevated/30 border-border hover:bg-bg-elevated hover:border-border/80 transition-all">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-bg-card border-border text-text-main">
              {STATUSES.map(s => (
                <SelectItem
                  key={s}
                  value={s}
                  className="text-xs hover:bg-bg-elevated cursor-pointer font-medium"
                >
                  {s === "UnderReview" ? "In Review" : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <AddApplicationModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        applicationId={application.id}
        initialData={application}
      />
    </>
  );
}
