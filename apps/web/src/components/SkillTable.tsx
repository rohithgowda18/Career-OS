import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { skillsApi } from "@/lib/api/skillsApi";
import {
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Loader2,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import EditSkillModal from "@/components/EditSkillModal";
import EmptyState from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { Badge } from "@/components/ui/badge";

interface SkillTableProps {
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  search: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  PROGRAMMING_LANGUAGE: "Programming Language",
  FRAMEWORK: "Framework",
  DATABASE: "Database",
  TOOL: "Tool",
  CONCEPT: "Concept",
  OTHER: "Other",
};

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

const LEVEL_COLORS: Record<string, "blue" | "orange" | "green"> = {
  BEGINNER: "blue",
  INTERMEDIATE: "orange",
  ADVANCED: "green",
};

export default function SkillTable({ page, setPage, pageSize, search }: SkillTableProps) {
  const { themeTokens } = useTheme();
  const [selectedSkill, setSelectedSkill] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const queryClient = useQueryClient();

  const skillsQuery = useQuery({
    queryKey: ["skills", page, search],
    queryFn: () => skillsApi.list({ page, size: pageSize, search }),
  });

  const deleteMutation = useMutation({
    mutationFn: skillsApi.delete,
    onSuccess: () => {
      toast.success("Skill deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["skills"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete skill");
    },
  });

  const handleEdit = (skill: any) => {
    setSelectedSkill(skill);
    setShowEditModal(true);
  };

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  if (skillsQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 bg-bg-card border border-border/60 rounded-xl">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs font-semibold text-text-dim uppercase tracking-wider animate-pulse">Loading skills...</p>
      </div>
    );
  }

  const { content: skills, totalPages, totalElements } = skillsQuery.data || { content: [], totalPages: 0, totalElements: 0 };

  if (skills.length === 0) {
    return (
      <EmptyState
        title="No Skills Found"
        description={search ? "No skills match your search query." : "Start adding skills you know to populate this list."}
        icon={Award}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-border/60 bg-bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={cn("border-b border-border/60 text-[10px] font-bold uppercase tracking-wider text-text-dim", themeTokens.tableHeaderClass)}>
                <th className="p-3">Skill</th>
                <th className="p-3">Category</th>
                <th className="p-3">Level</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {skills.map((s: any) => (
                <tr key={s.id} className={cn("transition-colors group", themeTokens.tableRowClass)}>
                  <td className={cn("p-3 font-semibold text-xs truncate max-w-[150px]", themeTokens.headingColor)}>{s.name}</td>
                  <td className={cn("p-3 text-xs", themeTokens.textColor)}>{CATEGORY_LABELS[s.category] || s.category}</td>
                  <td className="p-3 text-xs">
                    <Badge statusColor={LEVEL_COLORS[s.level] || "blue"} className="text-[10px]">
                      {LEVEL_LABELS[s.level] || s.level}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-75 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(s)}
                        className="h-8 w-8 text-text-dim hover:text-primary hover:bg-bg-elevated cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(s.id, s.name)}
                        className="h-8 w-8 text-text-dim hover:text-danger hover:bg-danger/10 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Grid/List View */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {skills.map((s: any) => (
          <div key={s.id} className="p-4 rounded-xl border border-border/60 bg-bg-card space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className={cn("text-sm font-bold truncate pr-2", themeTokens.headingColor)}>{s.name}</h3>
              <Badge statusColor={LEVEL_COLORS[s.level] || "blue"} className="text-[9px]">
                {LEVEL_LABELS[s.level] || s.level}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>{CATEGORY_LABELS[s.category] || s.category}</span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(s)}
                  className="h-8 w-8 text-text-dim hover:text-primary hover:bg-bg-elevated cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(s.id, s.name)}
                  className="h-8 w-8 text-text-dim hover:text-danger hover:bg-danger/10 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border/40 pt-4">
          <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider">
            Showing Page {page + 1} of {totalPages} ({totalElements} total)
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="h-8 w-8 bg-bg-card border-border/60 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-text-main" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
              className="h-8 w-8 bg-bg-card border-border/60 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-text-main" />
            </Button>
          </div>
        </div>
      )}

      {selectedSkill && (
        <EditSkillModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          skill={selectedSkill}
        />
      )}
    </div>
  );
}
