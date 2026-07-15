import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { skillsApi } from "@/lib/api/skillsApi";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface EditSkillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skill: any;
}

export default function EditSkillModal({ open, onOpenChange, skill }: EditSkillModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    category: "PROGRAMMING_LANGUAGE",
    level: "BEGINNER",
  });

  useEffect(() => {
    if (skill) {
      setFormData({
        name: skill.name,
        category: skill.category,
        level: skill.level,
      });
    }
  }, [skill]);

  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: skillsApi.update,
    onSuccess: () => {
      toast.success("Skill updated successfully");
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update skill");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Skill name is required");
      return;
    }
    updateMutation.mutate({ id: skill.id, ...formData });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-bg-card border-border text-text-main p-0 overflow-hidden rounded-xl">
        <DialogHeader className="p-5 border-b border-border/60">
          <DialogTitle className="text-sm font-semibold">Edit Skill</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name" className="text-[11px] font-semibold text-text-muted">Skill Name</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Java, React, Docker"
              className="bg-bg-main border-border text-text-main h-10 text-xs font-semibold focus:border-primary/65"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-category" className="text-[11px] font-semibold text-text-muted">Category</Label>
              <Select
                value={formData.category}
                onValueChange={v => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger className="bg-bg-main border-border h-10 text-xs text-text-main">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-bg-card border-border text-text-main">
                  <SelectItem value="PROGRAMMING_LANGUAGE">Programming Language</SelectItem>
                  <SelectItem value="FRAMEWORK">Framework</SelectItem>
                  <SelectItem value="DATABASE">Database</SelectItem>
                  <SelectItem value="TOOL">Tool</SelectItem>
                  <SelectItem value="CONCEPT">Concept</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-level" className="text-[11px] font-semibold text-text-muted">Level</Label>
              <Select
                value={formData.level}
                onValueChange={v => setFormData({ ...formData, level: v })}
              >
                <SelectTrigger className="bg-bg-main border-border h-10 text-xs text-text-main">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-bg-card border-border text-text-main">
                  <SelectItem value="BEGINNER">Beginner</SelectItem>
                  <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                  <SelectItem value="ADVANCED">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-bg-elevated/40 border-border text-xs text-text-muted hover:text-text-main h-9 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold h-9 cursor-pointer"
            >
              {updateMutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
