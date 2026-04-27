import { Application } from "@shared/types";
import { MoreVertical, ExternalLink, Trash2, Edit2 } from "lucide-react";
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
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import AddApplicationModal from "./AddApplicationModal";
import { DeadlineBadge } from "./DeadlineBadge";

interface ApplicationCardProps {
  application: Application;
}

const STATUSES = ["Interested", "Applied", "Under Review", "Accepted", "Rejected", "Withdrawn"] as const;

export default function ApplicationCard({ application }: ApplicationCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const utils = trpc.useUtils();

  const updateMutation = trpc.applications.update.useMutation({
    onSuccess: () => {
      utils.applications.list.invalidate();
      toast.success("Status updated");
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  const deleteMutation = trpc.applications.delete.useMutation({
    onSuccess: () => {
      utils.applications.list.invalidate();
      toast.success("Application deleted");
    },
    onError: () => {
      toast.error("Failed to delete application");
    },
  });

  const handleStatusChange = (newStatus: string) => {
    updateMutation.mutate({
      id: application.id,
      status: newStatus as any,
    });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this application?")) {
      deleteMutation.mutate({ id: application.id });
    }
  };

  return (
    <>
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-foreground truncate flex-1">
              {application.url ? (
                <a
                  href={application.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary hover:underline transition-colors"
                >
                  {application.eventName}
                </a>
              ) : (
                application.eventName
              )}
            </h4>
            {application.url && (
              <a
                href={application.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0"
                title="Open event page"
              >
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-primary transition-colors" />
              </a>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              {application.url && (
                <DropdownMenuItem
                  onClick={() => window.open(application.url!, "_blank")}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Link
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2 mb-3">
          <p className="text-xs text-muted-foreground">{application.eventType}</p>

          {application.deadline && (
            <DeadlineBadge deadline={application.deadline} showDate={true} />
          )}
        </div>

        {application.notes && (
          <p className="text-xs text-muted-foreground mb-3 truncate">
            {application.notes}
          </p>
        )}

        <div className="flex gap-2">
          <Select
            value={application.status}
            onValueChange={handleStatusChange}
            disabled={updateMutation.isPending}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
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
