import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JobDTO } from "@/lib/api/jobsApi";
import {
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Building2,
  MapPin,
  Briefcase,
  Clock,
  Banknote,
  Sparkles,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";

interface JobDetailsModalProps {
  job: JobDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveToggle: (job: JobDTO) => void;
  onTrack: (job: JobDTO) => void;
  isTracking?: boolean;
  isSaving?: boolean;
}

export default function JobDetailsModal({
  job,
  open,
  onOpenChange,
  onSaveToggle,
  onTrack,
  isTracking = false,
  isSaving = false,
}: JobDetailsModalProps) {
  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-bg-card border-border text-text-main shadow-2xl">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-border/60 bg-bg-elevated/40">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5 min-w-0 pr-6">
                <DialogTitle className="text-xl font-bold tracking-tight text-text-main leading-snug">
                  {job.title}
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-dim">
                  <span className="font-semibold text-text-main flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                    {job.company}
                  </span>
                  {job.location && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {job.location}
                      </span>
                    </>
                  )}
                  {job.source && (
                    <>
                      <span>•</span>
                      <span className="text-[11px] uppercase tracking-wider text-text-dim/80">
                        via {job.source}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Quick Badges */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {job.jobType && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs py-0.5">
                <Briefcase className="w-3 h-3 mr-1" />
                {job.jobType}
              </Badge>
            )}
            {job.workMode && (
              <Badge variant="outline" className="bg-bg-elevated border-border text-text-main text-xs py-0.5">
                {job.workMode}
              </Badge>
            )}
            {job.experienceLevel && (
              <Badge variant="outline" className="bg-bg-elevated border-border text-text-dim text-xs py-0.5">
                {job.experienceLevel}
              </Badge>
            )}
            {job.salary && (
              <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs py-0.5">
                <Banknote className="w-3 h-3 mr-1" />
                {job.salary}
              </Badge>
            )}
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-text-main leading-relaxed">
          {/* Skills Required */}
          {job.skills && job.skills.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-dim flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Skills & Technologies
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {job.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 text-xs rounded-md bg-bg-elevated border border-border/80 font-medium text-text-main"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-dim">
              Job Description
            </h4>
            <div className="bg-bg-elevated/20 border border-border/50 rounded-xl p-4 text-xs sm:text-sm text-text-muted leading-relaxed whitespace-pre-line">
              {job.description ? job.description : "No full description provided. Click Apply below to view complete details on the employer's official posting."}
            </div>
          </div>

          {/* External Notice */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-text-dim flex items-start gap-2.5">
            <ExternalLink className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-text-main">External Application Notice</p>
              <p className="text-[11px] mt-0.5">
                Clicking Apply will redirect you to the official job posting on <strong>{job.source || "the employer's site"}</strong> in a new browser tab.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 border-t border-border/60 bg-bg-elevated/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSaveToggle(job)}
              disabled={isSaving}
              className={cn(
                "h-9 px-3.5 text-xs font-semibold cursor-pointer border-border",
                job.saved && "bg-primary/10 text-primary border-primary/30"
              )}
            >
              {job.saved ? (
                <>
                  <BookmarkCheck className="w-4 h-4 mr-1.5 text-primary" />
                  Saved
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4 mr-1.5 text-text-dim" />
                  Save
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onTrack(job)}
              disabled={isTracking}
              className="h-9 px-3.5 text-xs font-semibold cursor-pointer border-border hover:border-primary/40 text-text-main"
            >
              <Layers className="w-4 h-4 mr-1.5 text-primary" />
              {isTracking ? "Tracking..." : "Track in Career OS"}
            </Button>
          </div>

          <Button
            size="sm"
            asChild
            className="h-9 px-5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm cursor-pointer"
          >
            <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
              Apply on {job.source || "Website"}
              <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
