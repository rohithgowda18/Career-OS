import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { skillsApi } from "@/lib/api/skillsApi";
import { toast } from "sonner";
import { Loader2, Trash2, Plus } from "lucide-react";
import { SKILL_CATALOG } from "@/lib/constants/skillCatalog";

interface EditCategorySkillsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: string;
  categoryLabel: string;
  skills: any[];
}

export default function EditCategorySkillsModal({
  open,
  onOpenChange,
  category,
  categoryLabel,
  skills,
}: EditCategorySkillsModalProps) {
  const queryClient = useQueryClient();
  const [localSkills, setLocalSkills] = useState<any[]>([]);
  const [removedIds, setRemovedIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setLocalSkills(skills.map(s => ({ ...s })));
      setRemovedIds([]);
    }
  }, [open, skills]);

  const handleLevelChange = (id: number, level: string) => {
    setLocalSkills(localSkills.map(s => (s.id === id ? { ...s, level } : s)));
  };

  const handleRemove = (id: number) => {
    setLocalSkills(localSkills.filter(s => s.id !== id));
    if (id > 0) {
      setRemovedIds([...removedIds, id]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const loadingToast = toast.loading(`Saving changes to ${categoryLabel}...`);

    try {
      await Promise.all([
        ...localSkills.map(s => {
          if (s.id < 0) {
            return skillsApi.create({
              name: s.name,
              category: s.category,
              level: s.level,
            });
          } else {
            return skillsApi.update(s.id, {
              name: s.name,
              category: s.category,
              level: s.level,
            });
          }
        }),
        ...removedIds.filter(id => id > 0).map(id => skillsApi.delete(id)),
      ]);

      toast.dismiss(loadingToast);
      toast.success("Category updated successfully");
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      onOpenChange(false);
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.message || "Failed to update category skills");
    } finally {
      setIsSaving(false);
    }
  };

  // Predefined catalog skills for this specific category
  const availableCatalogSkills = useMemo(() => {
    const categoryCatalog = SKILL_CATALOG.filter(s => s.category === category);
    return categoryCatalog.filter(
      cs => !localSkills.some(ls => ls.name.toLowerCase().trim() === cs.name.toLowerCase().trim())
    );
  }, [category, localSkills]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-bg-card border-border text-text-main p-0 overflow-hidden rounded-xl flex flex-col max-h-[85vh]">
        <DialogHeader className="p-5 border-b border-border/60">
          <DialogTitle className="text-sm font-semibold">Manage {categoryLabel} Skills</DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {localSkills.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-6">
              No skills in this category. Select one below to add it.
            </p>
          ) : (
            <div className="space-y-3.5">
              {localSkills.map(s => (
                <div key={s.id} className="flex items-center justify-between gap-3 p-3 bg-bg-main/30 border border-border/40 rounded-lg">
                  <span className="text-xs font-bold text-text-main truncate max-w-[150px]">{s.name}</span>
                  
                  <div className="flex items-center gap-2">
                    <Select
                      value={s.level}
                      onValueChange={(val) => handleLevelChange(s.id, val)}
                    >
                      <SelectTrigger className="w-28 h-8 text-[11px] bg-bg-card border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-bg-card border-border text-text-main">
                        <SelectItem value="BEGINNER">Beginner</SelectItem>
                        <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                        <SelectItem value="ADVANCED">Advanced</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(s.id)}
                      className="h-8 w-8 text-text-dim hover:text-danger hover:bg-danger/10 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick-add select for available catalog items */}
          {availableCatalogSkills.length > 0 && (
            <div className="pt-3 border-t border-border/40 space-y-2">
              <Label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                Add {categoryLabel} Skill from Catalog
              </Label>
              <Select
                value=""
                onValueChange={(val) => {
                  const found = availableCatalogSkills.find(s => s.name === val);
                  if (found) {
                    setLocalSkills([
                      ...localSkills,
                      {
                        id: -Date.now(), // Staged negative ID
                        name: found.name,
                        category: found.category,
                        level: "INTERMEDIATE",
                      },
                    ]);
                  }
                }}
              >
                <SelectTrigger className="w-full h-9 text-xs bg-bg-card border-dashed border-border hover:bg-bg-elevated/20 text-primary flex items-center justify-center gap-1.5 cursor-pointer">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Choose skill to add...</span>
                </SelectTrigger>
                <SelectContent className="bg-bg-card border-border text-text-main">
                  {availableCatalogSkills.map(cs => (
                    <SelectItem key={cs.name} value={cs.name}>
                      {cs.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border/60 bg-bg-main/50 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-bg-elevated/40 border-border text-xs text-text-muted hover:text-text-main h-9 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold h-9 cursor-pointer"
          >
            {isSaving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
