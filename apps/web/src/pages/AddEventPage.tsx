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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f10] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
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
      deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-bg-main text-text-main font-sans selection:bg-primary/30 relative overflow-hidden">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      <div className="container relative z-10 min-h-screen flex items-center justify-center py-12 px-6">
        <div className="w-full max-w-[550px] animate-in fade-in slide-in-from-bottom-4 duration-700">
          <button
            onClick={() => setLocation("/dashboard")}
            className="group flex items-center gap-2 text-text-muted hover:text-primary transition-all mb-8 text-[10px] font-black uppercase tracking-[0.2em]"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> 
            Back to Pipeline
          </button>

          <div className="bg-bg-card/40 backdrop-blur-2xl border border-border rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden group">
            {/* Card Inner Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[80px] rounded-full transition-opacity group-hover:opacity-100 opacity-50" />
            
            <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight uppercase">Import Protocol</h1>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1 opacity-60">Extracting intelligence from active terminal</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Objective Name</Label>
                <Input
                  value={formData.eventName}
                  onChange={e => setFormData({ ...formData, eventName: e.target.value })}
                  placeholder={formData.eventName ? "" : "Data missing..."}
                  className="bg-bg-elevated/50 border-border focus:border-primary/50 focus:ring-0 h-12 text-sm font-bold rounded-xl transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Classification</Label>
                  <Select
                    value={formData.eventType}
                    onValueChange={v => setFormData({ ...formData, eventType: v })}
                  >
                    <SelectTrigger className="bg-bg-elevated/50 border-border h-12 text-sm font-bold rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-bg-card border-border text-text-main backdrop-blur-xl">
                      {["Hackathon", "Workshop", "Conference", "Internship", "Other"].map(t => (
                        <SelectItem key={t} value={t} className="font-bold text-xs uppercase tracking-widest">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Current Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={v => setFormData({ ...formData, status: v })}
                  >
                    <SelectTrigger className="bg-bg-elevated/50 border-border h-12 text-sm font-bold rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-bg-card border-border text-text-main backdrop-blur-xl">
                      {["Interested", "Applied", "UnderReview", "Accepted", "Rejected"].map(s => (
                        <SelectItem key={s} value={s} className="font-bold text-xs uppercase tracking-widest">
                          {s === "UnderReview" ? "Under Review" : s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Temporal Deadline</Label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                  className="bg-bg-elevated/50 border-border focus:border-primary/50 focus:ring-0 h-12 text-sm font-bold rounded-xl [color-scheme:dark] transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1 flex items-center gap-2">
                  <ExternalLink className="w-3 h-3" /> Resource Identifier (URL)
                </Label>
                <Input
                  value={formData.url}
                  onChange={e => setFormData({ ...formData, url: e.target.value })}
                  placeholder={formData.url ? "" : "Link not detected..."}
                  className="bg-bg-elevated/50 border-border focus:border-primary/50 focus:ring-0 h-12 text-[10px] font-bold text-text-muted rounded-xl transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Coordinates (Location)</Label>
                <Input
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  placeholder={formData.location ? "" : "Scanning..."}
                  className="bg-bg-elevated/50 border-border focus:border-primary/50 focus:ring-0 h-12 text-sm font-bold rounded-xl transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Strategic Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Inject additional intelligence here..."
                  className="bg-bg-elevated/50 border-border focus:border-primary/50 focus:ring-0 min-h-[100px] text-sm font-medium rounded-xl resize-none transition-all"
                />
              </div>

              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-black uppercase tracking-[0.2em] text-xs h-14 mt-6 rounded-2xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3"
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Secure in Pipeline
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
