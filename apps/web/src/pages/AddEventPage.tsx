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
import { Loader2, ArrowLeft, ExternalLink, Sparkles, AlertTriangle, Terminal } from "lucide-react";
import { formatDateForBackend } from "@/lib/utils";

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
      queryClient.invalidateQueries({ queryKey: ["analytics", "dashboard"] });
      toast.success("Event added successfully");
      setLocation("/dashboard");
    },
    onError: (err: any) => {
      if (err.response?.status === 409) {
        toast.error("This event is already logged in your workspace", {
          icon: <AlertTriangle className="w-4 h-4 text-primary" />,
          duration: 5000
        });
      } else {
        toast.error(err.message || "Failed to save application");
      }
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.eventName.trim()) {
      toast.error("Event name is required");
      return;
    }
    createMutation.mutate({
      ...formData,
      deadline: formatDateForBackend(formData.deadline),
    });
  };

  return (
    <div className="min-h-screen bg-bg-main text-text-main font-sans selection:bg-primary/30 relative overflow-hidden">
      
      <div className="container relative z-10 min-h-screen flex flex-col items-center justify-center py-12 px-4">
        <div className="w-full max-w-[500px] animate-in fade-in duration-300">
          
          <button
            onClick={() => setLocation("/dashboard")}
            className="group flex items-center gap-2 text-text-dim hover:text-text-muted transition-colors mb-6 text-[11px] font-semibold uppercase tracking-wider cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" /> 
            Back to Workspace
          </button>

          <div className="bg-bg-card border border-border rounded-xl p-6 md:p-8 shadow-2xl relative overflow-hidden group">
            
            <div className="flex items-center gap-3.5 mb-8">
              <div className="w-11 h-11 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                <Terminal className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-text-main">Import Event Details</h1>
                <p className="text-[10px] text-text-dim uppercase tracking-wider mt-0.5">Configure event entry properties</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-text-muted">Event / Company Name *</Label>
                <Input
                  value={formData.eventName}
                  onChange={e => setFormData({ ...formData, eventName: e.target.value })}
                  placeholder="e.g. Stanford Hackathon"
                  className="bg-bg-main border-border text-text-main h-10 text-xs font-semibold focus:border-primary/65"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-text-muted">Category</Label>
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
                  <Label className="text-[11px] font-semibold text-text-muted">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={v => setFormData({ ...formData, status: v })}
                  >
                    <SelectTrigger className="bg-bg-main border-border h-10 text-xs text-text-main">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-bg-card border-border text-text-main">
                      {["Interested", "Applied", "UnderReview", "Accepted", "Rejected"].map(s => (
                        <SelectItem key={s} value={s} className="cursor-pointer text-xs">
                          {s === "UnderReview" ? "In Review" : s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-text-muted">Deadline Date</Label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                  className="bg-bg-main border-border text-text-main h-10 text-xs font-semibold [color-scheme:dark] focus:border-primary/65"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-text-muted flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-text-dim" /> Link URL
                </Label>
                <Input
                  value={formData.url}
                  onChange={e => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com/listing"
                  className="bg-bg-main border-border text-text-main h-10 text-xs font-semibold focus:border-primary/65"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-text-muted">Location / Coordinates</Label>
                <Input
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Remote or Stanford Campus"
                  className="bg-bg-main border-border text-text-main h-10 text-xs font-semibold focus:border-primary/65"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-text-muted">Private Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add checklists or preparation tasks..."
                  className="bg-bg-main border-border text-text-main min-h-[90px] text-xs font-semibold focus:border-primary/65 resize-none leading-relaxed"
                />
              </div>

              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full bg-primary hover:bg-primary-hover text-white font-semibold text-xs h-10.5 mt-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Add to Workspace</span>
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
