import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { placementsApi } from "@/lib/api/placementsApi";
import { toast } from "sonner";
import { Loader2, Calendar as CalendarIcon, Sparkles, Clipboard } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AddPlacementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const placementFormSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  role: z.string().min(1, "Role is required"),
  location: z.string().optional(),
  stipend: z.string().optional(),
  ctc: z.string().optional(),
  applicationLink: z.string().url("Invalid URL").or(z.literal("")).optional(),
  assessmentDate: z.date().optional(),
  interviewDate: z.date().optional(),
  status: z.string().min(1, "Status is required"),
});

type FormValues = z.infer<typeof placementFormSchema>;



export default function AddPlacementModal({ open, onOpenChange }: AddPlacementModalProps) {
  const [emailText, setEmailText] = useState("");
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const queryClient = useQueryClient();

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(placementFormSchema),
    defaultValues: {
      companyName: "",
      role: "",
      location: "",
      stipend: "",
      ctc: "",
      applicationLink: "",
      status: "APPLIED",
    },
  });

  const createMutation = useMutation({
    mutationFn: placementsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["placements"] });
      queryClient.invalidateQueries({ queryKey: ["analytics", "placements"] });
      toast.success("Placement secured in pipeline");
      onOpenChange(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.message || "Failed to add placement"),
  });

  const resetForm = () => {
    reset();
    setEmailText("");
    setShowQuickEntry(false);
  };

  const extractMutation = useMutation({
    mutationFn: placementsApi.extract,
    onSuccess: (extracted: any) => {
      if (extracted.companyName) setValue("companyName", extracted.companyName);
      if (extracted.role) setValue("role", extracted.role);
      if (extracted.location) setValue("location", extracted.location);
      if (extracted.stipend) setValue("stipend", extracted.stipend);
      if (extracted.ctc) setValue("ctc", extracted.ctc);
      if (extracted.applicationLink) setValue("applicationLink", extracted.applicationLink);
      if (extracted.assessmentDate) setValue("assessmentDate", extracted.assessmentDate ? new Date(extracted.assessmentDate) : undefined);
      if (extracted.interviewDate) setValue("interviewDate", extracted.interviewDate ? new Date(extracted.interviewDate) : undefined);
      if (extracted.status) setValue("status", extracted.status);
      toast.success("Extracted details pre-filled. Please verify and save.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to extract placement details using AI");
    }
  });

  const handleExtract = () => {
    if (!emailText.trim()) {
      toast.error("Please paste email/announcement content first");
      return;
    }
    extractMutation.mutate(emailText);
  };

  const onSubmitForm = (data: FormValues) => {
    createMutation.mutate(data);
  };

  const statusVal = watch("status");
  const assessDateVal = watch("assessmentDate");
  const interviewDateVal = watch("interviewDate");

  return (
    <Dialog open={open} onOpenChange={(v) => {
      onOpenChange(v);
      if (!v) resetForm();
    }}>
      <DialogContent className="max-w-xl bg-bg-card border-border text-text-main p-0 overflow-y-auto max-h-[90vh] rounded-2xl shadow-2xl">
        <DialogHeader className="p-6 bg-bg-hover/20 border-b border-border flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-black">New Placement</DialogTitle>
          <Button 
            variant="outline" 
            size="sm" 
            type="button"
            onClick={() => setShowQuickEntry(!showQuickEntry)}
            className="border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary text-[10px] uppercase font-black tracking-widest h-8"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Quick Entry
          </Button>
        </DialogHeader>

        {/* Quick Email Parsing Textarea */}
        {showQuickEntry && (
          <div className="p-6 border-b border-border/60 bg-bg-hover/5 space-y-3.5 animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Paste Placement Details</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExtract}
                disabled={extractMutation.isPending}
                className="text-xs text-primary font-bold hover:text-primary-hover hover:bg-primary/5 h-7"
              >
                {extractMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <Clipboard className="w-3.5 h-3.5 mr-1" />
                )}
                Extract Using AI
              </Button>
            </div>
            <Textarea
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              disabled={extractMutation.isPending}
              placeholder="Dear Students&#10;Campus recruitment by WorkIndia&#10;Job Designation: Software Development Engineer&#10;Stipend: 40k per month&#10;CTC: 16 LPA&#10;https://forms.gle/..."
              className="bg-bg-main border-border focus:border-primary/50 focus:ring-primary/20 min-h-[120px] text-xs leading-relaxed"
            />
            {extractMutation.isPending && (
              <p className="text-[10px] text-primary font-bold animate-pulse">
                Extracting details using AI... Please wait.
              </p>
            )}
            {!extractMutation.isPending && (
              <p className="text-[9px] text-text-muted/60 italic">We will extract details using Gemini AI to pre-fill the form.</p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmitForm)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="companyName" className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Company Name *</Label>
              <Input
                id="companyName"
                {...register("companyName")}
                placeholder="e.g. WorkIndia"
                className="bg-bg-main border-border focus:border-primary/50 focus:ring-primary/20 h-11 text-sm font-semibold"
              />
              {errors.companyName && <p className="text-xs text-danger">{errors.companyName.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role" className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Role / Position *</Label>
              <Input
                id="role"
                {...register("role")}
                placeholder="e.g. Software Development Engineer"
                className="bg-bg-main border-border focus:border-primary/50 focus:ring-primary/20 h-11 text-sm font-semibold"
              />
              {errors.role && <p className="text-xs text-danger">{errors.role.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="location" className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Location</Label>
              <Input
                id="location"
                {...register("location")}
                placeholder="e.g. Bangalore"
                className="bg-bg-main border-border focus:border-primary/50 focus:ring-primary/20 h-11 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Status *</Label>
              <Select
                value={statusVal}
                onValueChange={(v) => setValue("status", v, { shouldValidate: true })}
              >
                <SelectTrigger className="bg-bg-main border-border h-11 text-sm text-text-main">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-bg-card border-border text-text-main">
                  {[
                    { val: "APPLIED", label: "Applied" },
                    { val: "ASSESSMENT_SCHEDULED", label: "Assessment Scheduled" },
                    { val: "ASSESSMENT_COMPLETED", label: "Assessment Completed" },
                    { val: "INTERVIEW_SCHEDULED", label: "Interview Scheduled" },
                    { val: "INTERVIEW_COMPLETED", label: "Interview Completed" },
                    { val: "OFFER_RECEIVED", label: "Offer Received" },
                    { val: "REJECTED", label: "Rejected" },
                  ].map((item) => (
                    <SelectItem key={item.val} value={item.val} className="cursor-pointer">{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="stipend" className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Stipend</Label>
              <Input
                id="stipend"
                {...register("stipend")}
                placeholder="e.g. 40k per month"
                className="bg-bg-main border-border focus:border-primary/50 focus:ring-primary/20 h-11 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ctc" className="text-[10px] font-bold uppercase tracking-widest text-text-muted">CTC</Label>
              <Input
                id="ctc"
                {...register("ctc")}
                placeholder="e.g. 16 LPA"
                className="bg-bg-main border-border focus:border-primary/50 focus:ring-primary/20 h-11 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="applicationLink" className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Application Link</Label>
            <Input
              id="applicationLink"
              {...register("applicationLink")}
              placeholder="https://forms.gle/..."
              className="bg-bg-main border-border focus:border-primary/50 focus:ring-primary/20 h-11 text-sm"
            />
            {errors.applicationLink && <p className="text-xs text-danger">{errors.applicationLink.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: "assessmentDate", val: assessDateVal, label: "Assessment Date" },
              { id: "interviewDate", val: interviewDateVal, label: "Interview Date" },
            ].map((d) => (
              <div key={d.id} className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{d.label}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-bold bg-bg-main border-border hover:bg-bg-hover hover:text-text-main h-11 text-xs px-3",
                        !d.val && "text-text-muted"
                      )}
                    >
                      <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-primary shrink-0" />
                      {d.val ? format(d.val, "MM/dd/yyyy") : <span className="opacity-45">Pick date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-bg-card border-border shadow-2xl" align="start">
                    <Calendar
                      mode="single"
                      selected={d.val}
                      onSelect={(date) => setValue(d.id as any, date, { shouldValidate: true })}
                      initialFocus
                      className="bg-bg-card text-text-main"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
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
              disabled={createMutation.isPending}
              className="bg-primary hover:bg-primary-hover text-white font-black px-8 h-11 shadow-lg shadow-primary/20"
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Entry
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
