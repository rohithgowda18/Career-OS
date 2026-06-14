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
import { cn, formatDateForBackend } from "@/lib/utils";

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
      toast.success("Placement opportunity logged successfully");
      onOpenChange(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.message || "Failed to log placement opportunity"),
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
      toast.error(err.message || "Failed to extract details using Gemini");
    }
  });

  const handleExtract = () => {
    if (!emailText.trim()) {
      toast.error("Please paste email or placement announcement details first");
      return;
    }
    extractMutation.mutate(emailText);
  };

  const onSubmitForm = (data: FormValues) => {
    createMutation.mutate({
      ...data,
      assessmentDate: formatDateForBackend(data.assessmentDate) as any,
      interviewDate: formatDateForBackend(data.interviewDate) as any,
    });
  };

  const statusVal = watch("status");
  const assessDateVal = watch("assessmentDate");
  const interviewDateVal = watch("interviewDate");

  return (
    <Dialog open={open} onOpenChange={(v) => {
      onOpenChange(v);
      if (!v) resetForm();
    }}>
      <DialogContent className="max-w-xl bg-bg-card border-border text-text-main p-0 overflow-y-auto max-h-[90vh] rounded-xl shadow-2xl">
        <DialogHeader className="p-5 border-b border-border bg-bg-elevated/20 flex flex-row items-center justify-between">
          <DialogTitle className="text-sm font-semibold">New Placement Opportunity</DialogTitle>
          <Button 
            variant="outline" 
            size="sm" 
            type="button"
            onClick={() => setShowQuickEntry(!showQuickEntry)}
            className="border-primary/20 bg-primary/10 hover:bg-primary/15 text-primary text-[10px] uppercase font-semibold tracking-wider h-8"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            AI Quick Entry
          </Button>
        </DialogHeader>

        {/* Quick Email Parsing Textarea */}
        {showQuickEntry && (
          <div className="p-5 border-b border-border/60 bg-bg-elevated/10 space-y-3.5 animate-in slide-in-from-top-4 duration-200">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-semibold text-text-muted">Paste Placement Announcement Text</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExtract}
                disabled={extractMutation.isPending}
                className="text-xs text-primary font-semibold hover:text-primary-hover hover:bg-primary/5 h-7"
              >
                {extractMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <Clipboard className="w-3.5 h-3.5 mr-1" />
                )}
                Extract Details
              </Button>
            </div>
            <Textarea
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              disabled={extractMutation.isPending}
              placeholder="Example announcement text:&#10;WorkIndia is hiring Software Developers in Bangalore.&#10;Stipend is 40k. CTC is 16 LPA. Apply at: https://workindia.in/apply"
              className="bg-bg-main border-border text-text-main min-h-[110px] text-xs font-semibold leading-relaxed focus:border-primary/65 resize-none"
            />
            {extractMutation.isPending && (
              <p className="text-[10px] text-primary font-semibold animate-pulse">
                Gemini is parsing announcement text... Please wait.
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmitForm)} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="companyName" className="text-[11px] font-semibold text-text-muted">Company Name *</Label>
              <Input
                id="companyName"
                {...register("companyName")}
                placeholder="e.g. Stripe"
                className="bg-bg-main border-border text-text-main h-10 text-xs font-semibold focus:border-primary/65"
              />
              {errors.companyName && <p className="text-xs text-danger">{errors.companyName.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role" className="text-[11px] font-semibold text-text-muted">Role / Position *</Label>
              <Input
                id="role"
                {...register("role")}
                placeholder="e.g. Backend Developer"
                className="bg-bg-main border-border text-text-main h-10 text-xs font-semibold focus:border-primary/65"
              />
              {errors.role && <p className="text-xs text-danger">{errors.role.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="location" className="text-[11px] font-semibold text-text-muted">Location</Label>
              <Input
                id="location"
                {...register("location")}
                placeholder="e.g. San Francisco (Hybrid)"
                className="bg-bg-main border-border text-text-main h-10 text-xs font-semibold focus:border-primary/65"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-text-muted">Status *</Label>
              <Select
                value={statusVal}
                onValueChange={(v) => setValue("status", v, { shouldValidate: true })}
              >
                <SelectTrigger className="bg-bg-main border-border h-10 text-xs text-text-main">
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
                    <SelectItem key={item.val} value={item.val} className="cursor-pointer text-xs">{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="stipend" className="text-[11px] font-semibold text-text-muted">Stipend</Label>
              <Input
                id="stipend"
                {...register("stipend")}
                placeholder="e.g. 5k USD / mo"
                className="bg-bg-main border-border text-text-main h-10 text-xs font-semibold focus:border-primary/65"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ctc" className="text-[11px] font-semibold text-text-muted">CTC (Annual package)</Label>
              <Input
                id="ctc"
                {...register("ctc")}
                placeholder="e.g. 120k USD"
                className="bg-bg-main border-border text-text-main h-10 text-xs font-semibold focus:border-primary/65"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="applicationLink" className="text-[11px] font-semibold text-text-muted">Application Link (URL)</Label>
            <Input
              id="applicationLink"
              {...register("applicationLink")}
              placeholder="https://company.com/jobs/SDE"
              className="bg-bg-main border-border text-text-main h-10 text-xs font-semibold focus:border-primary/65"
            />
            {errors.applicationLink && <p className="text-xs text-danger">{errors.applicationLink.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: "assessmentDate", val: assessDateVal, label: "Assessment Date" },
              { id: "interviewDate", val: interviewDateVal, label: "Interview Date" },
            ].map((d) => (
              <div key={d.id} className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-text-muted">{d.label}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-semibold bg-bg-main border-border hover:bg-bg-elevated hover:text-text-main h-10 text-xs px-3",
                        !d.val && "text-text-dim"
                      )}
                    >
                      <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-primary shrink-0" />
                      {d.val ? format(d.val, "MM/dd/yyyy") : <span className="opacity-45">Pick date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-bg-card border-border shadow-lg" align="start">
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

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border/40 mt-2">
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
              disabled={createMutation.isPending}
              className="bg-primary hover:bg-primary-hover text-white font-semibold text-xs h-9.5 px-5 cursor-pointer"
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Create Entry
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
