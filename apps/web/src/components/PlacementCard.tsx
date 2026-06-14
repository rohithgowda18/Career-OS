import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar, Briefcase, MapPin, DollarSign, Globe, MoreVertical, Trash2, Edit2 } from "lucide-react";
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
  OFFER_RECEIVED: "Offer Received 🎉",
  REJECTED: "Rejected",
};

export default function PlacementCard({ placement, onEdit, onDelete }: PlacementCardProps) {

  return (
    <div 
      onClick={onEdit}
      className="card-premium flex flex-col justify-between group h-full cursor-pointer bg-bg-card/40 hover:bg-bg-elevated/40 transition-all border-border/80"
    >
      <div className="space-y-4">
        {/* Top Meta info */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1 min-w-0">
            <h4 className="text-base font-black text-text-main group-hover:text-primary transition-colors tracking-tight line-clamp-1">
              {placement.companyName}
            </h4>
            <p className="text-xs font-bold text-text-muted/80 flex items-center gap-1.5">
              <Briefcase className="w-3 h-3 text-text-muted/40" />
              {placement.role}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={cn("text-[9px] px-3.5 py-1.5 rounded-lg border font-black uppercase tracking-widest", STATUS_CLASSES[placement.status] || "bg-bg-elevated text-text-muted border-border")}>
              {STATUS_LABELS[placement.status] || placement.status}
            </span>

            {(onEdit || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => e.stopPropagation()}
                    className="h-8 w-8 rounded-lg hover:bg-bg-elevated opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="w-4 h-4 text-text-muted" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-bg-card border-border text-text-main shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  {onEdit && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                      }}
                      className="hover:bg-bg-elevated cursor-pointer font-bold text-xs"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-2" /> Modify Entry
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                      className="text-danger hover:bg-danger/10 cursor-pointer font-bold text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Item
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Content details grid */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {placement.location && (
            <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
              <MapPin className="w-3.5 h-3.5 text-text-muted/40 shrink-0" />
              <span className="truncate">{placement.location}</span>
            </div>
          )}
          {placement.stipend && (
            <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
              <DollarSign className="w-3.5 h-3.5 text-text-muted/40 shrink-0" />
              <span className="truncate">Stipend: {placement.stipend}</span>
            </div>
          )}
          {placement.ctc && (
            <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
              <DollarSign className="w-3.5 h-3.5 text-text-muted/40 shrink-0" />
              <span className="truncate">CTC: {placement.ctc}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer info (Links) */}
      <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-end text-[10px] text-text-muted font-black uppercase tracking-widest">

        {placement.applicationLink && (
          <a
            href={placement.applicationLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 text-primary hover:text-primary-hover hover:underline py-1"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Apply</span>
          </a>
        )}
      </div>
    </div>
  );
}
