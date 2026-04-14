import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Wand2, AlertCircle } from "lucide-react";
import { useApplicationProfile } from "@/hooks/useApplicationProfile";

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
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    eventName: initialData?.eventName || "",
    eventType: initialData?.eventType || "Hackathon",
    status: initialData?.status || "Interested",
    deadline: initialData?.deadline ? new Date(initialData.deadline).toISOString().split("T")[0] : "",
    notes: initialData?.notes || "",
    url: initialData?.url || "",
  });
  const debounceTimer = useRef<NodeJS.Timeout>();
  const lastFetchedUrl = useRef<string>("");
  
  // Application profile hook
  const { profile, hasProfile, formatProfileForNotes } = useApplicationProfile();

  const utils = trpc.useUtils();
  const createMutation = trpc.applications.create.useMutation({
    onSuccess: () => {
      utils.applications.list.invalidate();
      toast.success("Application added successfully");
      onOpenChange(false);
      setFormData({
        eventName: "",
        eventType: "Hackathon",
        status: "Interested",
        deadline: "",
        notes: "",
        url: "",
      });
      setMetadataError(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add application");
    },
  });

  const updateMutation = trpc.applications.update.useMutation({
    onSuccess: () => {
      utils.applications.list.invalidate();
      toast.success("Application updated successfully");
      onOpenChange(false);
      setMetadataError(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update application");
    },
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const fetchMetadataMutation = trpc.applications.fetchMetadata.useMutation({
    onSuccess: (data) => {
      console.log('[AddApplicationModal] Fetch metadata response:', data);
      
      if (data.success && data.data) {
        console.log('[AddApplicationModal] Metadata received:', {
          title: data.data.title,
          description: data.data.description,
          deadline: data.data.deadline,
          eventType: data.data.eventType,
        });

        // Smart autofill: only fill empty fields to avoid overwriting user input
        setFormData((prev) => {
          const updated = {
            ...prev,
            eventName: prev.eventName || data.data?.title || "",
            notes: prev.notes || data.data?.description || "",
            deadline: prev.deadline || data.data?.deadline || "",
            eventType: prev.eventType === "Hackathon" && data.data?.eventType ? data.data.eventType : prev.eventType,
          };
          console.log('[AddApplicationModal] Updated form data:', updated);
          return updated;
        });
        
        // Determine which fields were auto-filled
        const filledFields = [];
        if (!formData.eventName && data.data.title) filledFields.push("Event Name");
        if (!formData.notes && data.data.description) filledFields.push("Description");
        if (!formData.deadline && data.data.deadline) filledFields.push("Deadline");
        if (data.data.eventType && formData.eventType === "Hackathon") filledFields.push("Event Type");
        
        const message = filledFields.length > 0 
          ? `Auto-filled: ${filledFields.join(", ")}. You can edit any field.`
          : "Metadata fetched, but no new information found.";
        
        console.log('[AddApplicationModal] Toast message:', message);
        toast.success(message);
        setMetadataError(null);
      } else if (data.error) {
        console.error('[AddApplicationModal] Fetch error:', data.error);
        setMetadataError(data.error);
        toast.error(data.error);
      } else {
        const errorMsg = "Failed to fetch metadata";
        console.error('[AddApplicationModal]', errorMsg);
        setMetadataError(errorMsg);
        toast.error(errorMsg);
      }
      setIsFetchingMetadata(false);
    },
    onError: (error) => {
      const errorMsg = error.message || "Failed to fetch event details";
      console.error('[AddApplicationModal] Mutation error:', errorMsg);
      setMetadataError(errorMsg);
      toast.error(errorMsg);
      setIsFetchingMetadata(false);
    },
  });

  const handleFetchMetadata = async () => {
    if (!formData.url.trim()) {
      toast.error("Please enter a URL first");
      return;
    }

    // Reset error state
    setMetadataError(null);
    setIsFetchingMetadata(true);
    
    // Normalize URL
    let url = formData.url.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }
    
    fetchMetadataMutation.mutate({ url });
  };

  const handleAutofillProfile = () => {
    if (!hasProfile) {
      toast.error("Profile not set. Set up your profile in Settings first.");
      return;
    }

    if (!profile) {
      toast.error("Could not load profile data");
      return;
    }

    // Append profile info to notes without overwriting
    const profileText = formatProfileForNotes();
    const newNotes = (formData.notes || "") + profileText;
    
    setFormData({ ...formData, notes: newNotes });
    toast.success("Profile information added to notes");
    console.log('[AddApplicationModal] Profile autofilled:', profileText);
  };

  // Auto-fetch metadata when user finishes typing URL
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setFormData({ ...formData, url: newUrl });
    setMetadataError(null);

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Only auto-fetch if URL looks valid and is different from last fetched
    if (newUrl.trim() && newUrl !== lastFetchedUrl.current) {
      let normalizedUrl = newUrl.trim();
      if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
        normalizedUrl = `https://${normalizedUrl}`;
      }

      // Check if it looks like a URL (has a dot or is already a full URL)
      const looksLikeUrl = normalizedUrl.includes(".") || normalizedUrl.startsWith("http");
      
      if (looksLikeUrl && !formData.eventName.trim()) {
        // Debounce: wait 1 second after user stops typing before auto-fetching
        debounceTimer.current = setTimeout(() => {
          setIsFetchingMetadata(true);
          lastFetchedUrl.current = normalizedUrl;
          fetchMetadataMutation.mutate({ url: normalizedUrl });
        }, 1000);
      }
    }
  };

  const handleClear = () => {
    setFormData({
      eventName: "",
      eventType: "Hackathon",
      status: "Interested",
      deadline: "",
      notes: "",
      url: "",
    });
    setMetadataError(null);
    lastFetchedUrl.current = "";
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    console.log('[AddApplicationModal] Form cleared');
    toast.success("Form cleared");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.eventName.trim()) {
      toast.error("Please enter an event name or paste a URL and wait for auto-fill");
      return;
    }

    const deadline = formData.deadline ? new Date(formData.deadline) : undefined;

    if (applicationId) {
      updateMutation.mutate({
        id: applicationId,
        ...formData,
        deadline,
      });
    } else {
      createMutation.mutate({
        ...formData,
        deadline,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {applicationId ? "Edit Application" : "Add New Application"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Name */}
          <div className="space-y-2">
            <Label htmlFor="eventName">Event Name *</Label>
            <Input
              id="eventName"
              placeholder="e.g., TechCrunch Disrupt 2024"
              value={formData.eventName}
              onChange={(e) =>
                setFormData({ ...formData, eventName: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Event Type */}
            <div className="space-y-2">
              <Label htmlFor="eventType">Event Type</Label>
              <Select
                value={formData.eventType}
                onValueChange={(value) =>
                  setFormData({ ...formData, eventType: value })
                }
              >
                <SelectTrigger id="eventType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hackathon">Hackathon</SelectItem>
                  <SelectItem value="Workshop">Workshop</SelectItem>
                  <SelectItem value="Conference">Conference</SelectItem>
                  <SelectItem value="Internship">Internship</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Interested">Interested</SelectItem>
                  <SelectItem value="Applied">Applied</SelectItem>
                  <SelectItem value="Under Review">Under Review</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) =>
                setFormData({ ...formData, deadline: e.target.value })
              }
            />
          </div>

          {/* Event URL with Metadata Fetch */}
          <div className="space-y-2">
            <Label htmlFor="url">Event URL</Label>
            <div className="flex gap-2">
              <Input
                id="url"
                type="text"
                placeholder="https://example.com/event (or just example.com)"
                value={formData.url}
                onChange={handleUrlChange}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleFetchMetadata}
                disabled={isFetchingMetadata || isLoading || !formData.url.trim()}
                title="Manually fetch event details from URL"
              >
                {isFetchingMetadata ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
              </Button>
            </div>
            {metadataError && (
              <div className="flex gap-2 items-start text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Couldn't fetch details from URL</p>
                  <p className="text-xs mt-1">{metadataError}</p>
                  <p className="text-xs mt-2">You can still add the event manually - all fields can be edited.</p>
                </div>
              </div>
            )}
            {!metadataError && formData.url && (
              <p className="text-xs text-gray-500 mt-1">
                💡 Tip: Auto-fetches event name, description, type, and deadline (if available).
              </p>
            )}
          </div>

          {/* Notes / Description */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="notes">Description / Notes</Label>
              {hasProfile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAutofillProfile}
                  className="text-xs h-6"
                  title="Append your saved profile to notes"
                >
                  + Autofill From Profile
                </Button>
              )}
            </div>
            <Textarea
              id="notes"
              placeholder="Add event description, notes, ideas, or important information..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={4}
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setMetadataError(null);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              disabled={isLoading}
              title="Clear all form fields"
            >
              Clear
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {applicationId ? "Update" : "Add"} Application
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
