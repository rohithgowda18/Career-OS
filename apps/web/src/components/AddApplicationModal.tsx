import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { applicationsApi } from "@/lib/api/applicationsApi";
import { toast } from "sonner";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn, formatDateForBackend } from "@/lib/utils";

interface AddApplicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId?: number;
  initialData?: any;
}

export default function AddApplicationModal({
  open,
  onOpenChange,
  applicationId,
  initialData,
}: AddApplicationModalProps) {
  const [formData, setFormData] = useState({
    eventName: initialData?.eventName || "",
    eventType: initialData?.eventType || "Hackathon",
    status: initialData?.status || "Interested",
    deadline: initialData?.deadline ? new Date(initialData.deadline) : undefined,
    notes: initialData?.notes || "",
    url: initialData?.url || "",
  });

  const queryClient = useQueryClient();
  
  const createMutation = useMutation({
    mutationFn: applicationsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["analytics", "dashboard"] });
      toast.success("Application logged successfully");
      onOpenChange(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.message || "Failed to add application"),
  });

  const updateMutation = useMutation({
    mutationFn: applicationsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["analytics", "dashboard"] });
      toast.success("Application updated successfully");
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err.message || "Failed to update application"),
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const resetForm = () => {
    setFormData({
      eventName: "",
      eventType: "Hackathon",
      status: "Interested",
      deadline: undefined,
      notes: "",
      url: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.eventName.trim()) {
      toast.error("Event name is required");
      return;
    }

    const payload = {
      ...formData,
      deadline: formatDateForBackend(formData.deadline),
    };

    if (applicationId) {
      updateMutation.mutate({ id: applicationId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-bg-card border-border text-text-main p-0 overflow-y-auto max-h-[90vh] rounded-xl shadow-2xl">
        <DialogHeader className="p-5 border-b border-border bg-bg-elevated/20">
          <DialogTitle className="text-sm font-semibold">{applicationId ? "Edit" : "New"} Application</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="eventName" className="text-[11px] font-semibold text-text-muted">Event / Company Name</Label>
            <Input
              id="eventName"
              value={formData.eventName}
              onChange={e => setFormData({ ...formData, eventName: e.target.value })}
              placeholder="e.g. Stanford Hackathon"
              className="bg-bg-main border-border text-text-main h-10 text-xs font-semibold focus:border-primary/65"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="eventType" className="text-[11px] font-semibold text-text-muted">Category</Label>
              <Select
                value={formData.eventType}
                onValueChange={v => setFormData({ ...formData, eventType: v })}
              >
                <SelectTrigger className="bg-bg-main border-border h-10 text-xs text-text-main">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-bg-card border-border text-text-main">
                  {["Hackathon", "Workshop", "Conference", "Internship", "Other"].map(t => (
                    <SelectItem key={t} value={t} className="cursor-pointer text-xs">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-[11px] font-semibold text-text-muted">Status</Label>
              <Select
                value={formData.status}
                onValueChange={v => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger className="bg-bg-main border-border h-10 text-xs text-text-main">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-bg-card border-border text-text-main">
                  {["Interested", "Applied", "UnderReview", "Accepted", "Rejected"].map(s => (
                    <SelectItem key={s} value={s} className="cursor-pointer text-xs">{s === "UnderReview" ? "In Review" : s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-text-muted">Deadline</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-semibold bg-bg-main border-border hover:bg-bg-elevated hover:text-text-main h-10 text-xs px-3",
                    !formData.deadline && "text-text-dim"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary shrink-0" />
                  {formData.deadline ? format(formData.deadline, "PPP") : <span>Select deadline date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-bg-card border-border shadow-lg" align="start">
                <Calendar
                  mode="single"
                  selected={formData.deadline}
                  onSelect={(date) => setFormData({ ...formData, deadline: date })}
                  initialFocus
                  className="bg-bg-card text-text-main"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="url" className="text-[11px] font-semibold text-text-muted">Application Link (URL)</Label>
            <Input
              id="url"
              value={formData.url}
              onChange={e => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://example.com/apply"
              className="bg-bg-main border-border text-text-main h-10 text-xs font-semibold focus:border-primary/65"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-[11px] font-semibold text-text-muted">Private Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add personal checklists, access URLs, or study notes..."
              rows={3}
              className="bg-bg-main border-border text-text-main min-h-[90px] text-xs font-semibold focus:border-primary/65 resize-none leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border/40">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="text-text-muted hover:text-text-main hover:bg-bg-elevated text-xs font-semibold h-9.5 px-4 cursor-pointer"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-primary hover:bg-primary-hover text-white font-semibold text-xs h-9.5 px-5 cursor-pointer"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              {applicationId ? "Save Changes" : "Log Application"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
