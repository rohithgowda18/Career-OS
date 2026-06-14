import { cn } from "@/lib/utils";
import { Briefcase, MapPin, DollarSign, Globe, MoreVertical, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PlacementCardProps {
  placement: any;
  onEdit?: () => void;
  onDelete?: () => void;
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
  OFFER_RECEIVED: "Offer Received 🎉",
  REJECTED: "Rejected",
};

export default function PlacementCard({ placement, onEdit, onDelete }: PlacementCardProps) {
  return (
    <div 
      onClick={onEdit}
      className="card-premium flex flex-col justify-between group h-full cursor-pointer bg-bg-card border border-border hover:border-border/80 transition-all p-4.5"
    >
      <div className="space-y-3.5">
        {/* Top Info */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5 flex-1 min-w-0">
            <h4 className="text-xs font-semibold text-text-main group-hover:text-primary transition-colors truncate">
              {placement.companyName}
            </h4>
            <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5 truncate">
              <Briefcase className="w-3 h-3 text-text-dim shrink-0" />
              <span>{placement.role}</span>
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className={cn("text-[9px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider", STATUS_CLASSES[placement.status] || "bg-bg-elevated text-text-muted border-border")}>
              {STATUS_LABELS[placement.status] || placement.status}
            </span>

            {(onEdit || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => e.stopPropagation()}
                    className="h-8 w-8 rounded-lg hover:bg-bg-elevated"
                  >
                    <MoreVertical className="w-4 h-4 text-text-dim" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-bg-card border-border text-text-main shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  {onEdit && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                      }}
                      className="hover:bg-bg-elevated cursor-pointer font-semibold text-xs py-2 px-3"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-2 text-text-dim" /> Modify Entry
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                      className="text-danger hover:bg-danger/10 cursor-pointer font-semibold text-xs py-2 px-3"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Item
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {placement.location && (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-text-muted truncate">
              <MapPin className="w-3.5 h-3.5 text-text-dim shrink-0" />
              <span className="truncate">{placement.location}</span>
            </div>
          )}
          {placement.stipend && (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-text-muted truncate">
              <DollarSign className="w-3.5 h-3.5 text-text-dim shrink-0" />
              <span className="truncate">Stipend: {placement.stipend}</span>
            </div>
          )}
          {placement.ctc && (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-text-muted truncate">
              <DollarSign className="w-3.5 h-3.5 text-text-dim shrink-0" />
              <span className="truncate">CTC: {placement.ctc}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer / Links */}
      {placement.applicationLink && (
        <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-end text-[10px] text-text-muted font-semibold uppercase tracking-wider">
          <a
            href={placement.applicationLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 text-primary hover:text-primary-hover py-1"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Apply</span>
          </a>
        </div>
      )}
    </div>
  );
}
