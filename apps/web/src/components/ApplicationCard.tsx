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
}

const STATUSES = [
  "Interested",
  "Applied",
  "UnderReview",
  "Accepted",
  "Rejected",
] as const;

export default function ApplicationCard({ application }: ApplicationCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: applicationsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Status updated");
    },
    onError: () => toast.error("Update failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: applicationsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Deleted");
    },
    onError: () => toast.error("Delete failed"),
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

  return (
    <>
      <div className="group relative rounded-2xl border border-border bg-bg-elevated p-4 shadow-sm hover:shadow-xl hover:border-primary/50 hover:-translate-y-1 transition-all duration-300">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-black text-[13px] text-text-main group-hover:text-primary transition-colors truncate tracking-tight">
              {application.eventName}
            </h4>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[9px] text-text-muted font-black uppercase tracking-widest bg-bg-card px-2 py-0.5 rounded border border-border/50">
                {application.eventType}
              </span>
              {application.url && (
                <a
                  href={application.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted hover:text-accent transition-colors"
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
                className="h-7 w-7 rounded-lg hover:bg-bg-card opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-4 h-4 text-text-muted" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-bg-card border-border text-text-main shadow-2xl"
            >
              <DropdownMenuItem
                onClick={() => setShowEditModal(true)}
                className="hover:bg-bg-elevated cursor-pointer font-bold text-xs"
              >
                <Edit2 className="w-3.5 h-3.5 mr-2" /> Modify Entry
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => deleteMutation.mutate(application.id)}
                className="text-danger hover:bg-danger/10 cursor-pointer font-bold text-xs"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Item
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {deadlineDate && (
          <div
            className={cn(
              "flex items-center gap-2 mb-4 px-3 py-2 rounded-lg border text-xs font-black uppercase tracking-wider transition-all duration-300",
              isUrgent
                ? "bg-danger/10 border-danger/20 text-danger animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                : "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
            )}
          >
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{format(deadlineDate, "MMM d, yyyy")}</span>
          </div>
        )}

        {!deadlineDate && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg border bg-bg-card border-border/30 text-text-muted text-xs font-bold uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
            <span className="opacity-60">No deadline set</span>
          </div>
        )}

        {application.notes && (
          <p className="text-[11px] text-text-muted/60 mb-5 line-clamp-2 italic font-medium leading-relaxed border-l-2 border-border pl-3">
            "{application.notes}"
          </p>
        )}

        <div className="flex items-center gap-2 pt-3 border-t border-border/40">
          <Select
            value={application.status}
            onValueChange={handleStatusChange}
            disabled={updateMutation.isPending}
          >
            <SelectTrigger className="h-8 text-[9px] font-black uppercase tracking-widest bg-bg-card/50 border-border hover:bg-bg-card hover:border-primary/40 transition-all">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-bg-card border-border text-text-main">
              {STATUSES.map(s => (
                <SelectItem
                  key={s}
                  value={s}
                  className="text-xs hover:bg-bg-elevated cursor-pointer font-bold"
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
