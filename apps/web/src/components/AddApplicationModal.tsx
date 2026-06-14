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
import { cn } from "@/lib/utils";

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
      toast.success("Application added");
      onOpenChange(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.message || "Failed to add"),
  });

  const updateMutation = useMutation({
    mutationFn: applicationsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Application updated");
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err.message || "Failed to update"),
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
      deadline: formData.deadline ? formData.deadline : undefined,
    };

    if (applicationId) {
      updateMutation.mutate({ id: applicationId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-bg-card border-border text-text-main p-0 overflow-y-auto max-h-[90vh] rounded-2xl shadow-2xl">
        <DialogHeader className="p-6 bg-bg-hover/20 border-b border-border">
          <DialogTitle className="text-xl font-black">{applicationId ? "Edit" : "New"} Application</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="eventName" className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Event Name</Label>
            <Input
              id="eventName"
              value={formData.eventName}
              onChange={e => setFormData({ ...formData, eventName: e.target.value })}
              placeholder="e.g. Google Hash Code"
              className="bg-bg-main border-border focus:border-primary/50 focus:ring-primary/20 h-11"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="eventType" className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Type</Label>
              <Select
                value={formData.eventType}
                onValueChange={v => setFormData({ ...formData, eventType: v })}
              >
                <SelectTrigger className="bg-bg-main border-border h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-bg-card border-border text-text-main">
                  {["Hackathon", "Workshop", "Conference", "Internship", "Other"].map(t => (
                    <SelectItem key={t} value={t} className="cursor-pointer">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Status</Label>
              <Select
                value={formData.status}
                onValueChange={v => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger className="bg-bg-main border-border h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-bg-card border-border text-text-main">
                  {["Interested", "Applied", "UnderReview", "Accepted", "Rejected"].map(s => (
                    <SelectItem key={s} value={s} className="cursor-pointer">{s === "UnderReview" ? "Under Review" : s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Deadline</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-bold bg-bg-main border-border hover:bg-bg-hover hover:text-text-main h-11",
                    !formData.deadline && "text-text-muted"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                  {formData.deadline ? format(formData.deadline, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-bg-card border-border shadow-2xl" align="start">
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
            <Label htmlFor="url" className="text-[10px] font-bold uppercase tracking-widest text-text-muted">External URL</Label>
            <Input
              id="url"
              value={formData.url}
              onChange={e => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://event-link.com"
              className="bg-bg-main border-border focus:border-primary/50 focus:ring-primary/20 h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Internal Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any extra details, passwords, or prep notes..."
              rows={3}
              className="bg-bg-main border-border focus:border-primary/50 focus:ring-primary/20 min-h-[90px] resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="text-text-muted hover:text-text-main hover:bg-bg-hover font-bold"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-primary hover:bg-primary-hover text-white font-black px-8 h-11 shadow-lg shadow-primary/20"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {applicationId ? "Save Changes" : "Create Application"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
