import { useEffect, useState } from "react";
import { useLocation } from "wouter";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { applicationsApi } from "@/lib/api/applicationsApi";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ExternalLink, Sparkles, AlertTriangle } from "lucide-react";

export default function AddEventPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Parse query params
  const searchParams = new URLSearchParams(window.location.search);
  const initialTitle = searchParams.get("title") || "";
  const initialUrl = searchParams.get("url") || "";
  const initialDate = searchParams.get("date") || "";
  const initialLocation = searchParams.get("location") || "";
  const initialDescription = searchParams.get("description") || "";

  // Helper to format extracted date for HTML input
  const formatExtractedDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    } catch (e) {}
    return "";
  };

  const [formData, setFormData] = useState({
    eventName: initialTitle,
    eventType: "Hackathon",
    status: "Interested",
    deadline: formatExtractedDate(initialDate),
    notes: initialDescription,
    url: initialUrl,
    location: initialLocation,
  });

  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const currentPath = window.location.pathname + window.location.search;
      toast.error("Please login to save this event");
      setLocation(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [isAuthenticated, authLoading, setLocation]);

  const createMutation = useMutation({
    mutationFn: applicationsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Event secured in pipeline");
      setLocation("/dashboard");
    },
    onError: (err: any) => {
      if (err.response?.status === 409) {
        toast.error("Strategy duplicate detected: This event is already in your pipeline", {
          icon: <AlertTriangle className="w-4 h-4 text-primary" />,
          duration: 5000
        });
      } else {
        toast.error(err.message || "Failed to save application");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.eventName.trim()) {
      toast.error("Event name is required");
      return;
    }
    createMutation.mutate({
      ...formData,
      deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-[#0f0f10] text-[#e4e4e7] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[500px]">
        <button
          onClick={() => setLocation("/dashboard")}
          className="flex items-center gap-2 text-[#a1a1aa] hover:text-[#e4e4e7] transition-colors mb-8 text-xs font-bold uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel
        </button>

        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-[#f97316] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Import Application</h1>
              <p className="text-xs text-[#a1a1aa] font-medium mt-0.5">Imported from current page</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa]">Event Name</Label>
              <Input
                value={formData.eventName}
                onChange={e => setFormData({ ...formData, eventName: e.target.value })}
                placeholder={formData.eventName ? "" : "Not detected"}
                className="bg-[#0f0f10] border-[#27272a] focus:border-[#f97316] focus:ring-0 h-11 text-sm font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa]">Event Type</Label>
                <Select
                  value={formData.eventType}
                  onValueChange={v => setFormData({ ...formData, eventType: v })}
                >
                  <SelectTrigger className="bg-[#0f0f10] border-[#27272a] h-11 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#18181b] border-[#27272a] text-[#e4e4e7]">
                    {["Hackathon", "Workshop", "Conference", "Internship", "Other"].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa]">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={v => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger className="bg-[#0f0f10] border-[#27272a] h-11 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#18181b] border-[#27272a] text-[#e4e4e7]">
                    {["Interested", "Applied", "UnderReview", "Accepted", "Rejected"].map(s => (
                      <SelectItem key={s} value={s}>{s === "UnderReview" ? "Under Review" : s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa]">Deadline (Optional)</Label>
              <Input
                type="date"
                value={formData.deadline}
                onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                className="bg-[#0f0f10] border-[#27272a] focus:border-[#f97316] focus:ring-0 h-11 text-sm [color-scheme:dark]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa] flex items-center gap-2">
                <ExternalLink className="w-3 h-3" /> Event URL
              </Label>
              <Input
                value={formData.url}
                onChange={e => setFormData({ ...formData, url: e.target.value })}
                placeholder={formData.url ? "" : "Not detected"}
                className="bg-[#0f0f10] border-[#27272a] focus:border-[#f97316] focus:ring-0 h-11 text-xs text-[#a1a1aa]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa]">Location</Label>
              <Input
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                placeholder={formData.location ? "" : "Not detected"}
                className="bg-[#0f0f10] border-[#27272a] focus:border-[#f97316] focus:ring-0 h-11 text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa]">Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any extra details..."
                className="bg-[#0f0f10] border-[#27272a] focus:border-[#f97316] focus:ring-0 min-h-[80px] text-sm resize-none"
              />
            </div>

            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full bg-[#f97316] hover:bg-[#ea580c] text-white font-bold h-12 mt-4 rounded-lg transition-all"
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save to Dashboard
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
