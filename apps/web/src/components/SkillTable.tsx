import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { skillsApi } from "@/lib/api/skillsApi";
import { Loader2, Award, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import EditCategorySkillsModal from "@/components/EditCategorySkillsModal";
import EmptyState from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

interface SkillTableProps {
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  search: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  BACKEND: "Backend Development",
  FRONTEND: "Frontend",
  DATABASE: "Databases",
  DEVOPS: "DevOps",
  CLOUD: "Cloud",
  COMPUTER_SCIENCE: "Computer Science",
  AI_ML: "AI / Machine Learning",
  MOBILE: "Mobile",
  TESTING: "Testing",
  OTHER: "Others",
};

export default function SkillTable({ page, setPage, pageSize, search }: SkillTableProps) {
  const { themeTokens } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Load all skills for grouping in the portfolio view
  const skillsQuery = useQuery({
    queryKey: ["skills", search],
    queryFn: () => skillsApi.list({ page: 0, size: 1000, search }),
  });

  const skills = skillsQuery.data?.content || [];

  const groupedSkills = useMemo(() => {
    const groups: Record<string, any[]> = {};
    Object.keys(CATEGORY_LABELS).forEach(cat => {
      groups[cat] = [];
    });

    skills.forEach((s: any) => {
      if (groups[s.category]) {
        groups[s.category].push(s);
      } else {
        // Fallback fallback
        if (!groups[s.category]) {
          groups[s.category] = [];
        }
        groups[s.category].push(s);
      }
    });

    return groups;
  }, [skills]);

  const handleEditCategory = (cat: string, label: string, catSkills: any[]) => {
    setSelectedCategory({
      category: cat,
      categoryLabel: label,
      skills: catSkills,
    });
    setShowEditModal(true);
  };

  if (skillsQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 bg-bg-card border border-border/60 rounded-xl">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs font-semibold text-text-dim uppercase tracking-wider animate-pulse">Loading skills...</p>
      </div>
    );
  }

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
    <div className="space-y-6 bg-bg-card border border-border/60 rounded-xl p-6 md:p-8 shadow-xs">
      <div className="divide-y divide-border/40 space-y-6">
        {Object.entries(groupedSkills).map(([cat, catSkills], index) => {
          if (catSkills.length === 0) return null;
          const label = CATEGORY_LABELS[cat] || cat;

          return (
            <div
              key={cat}
              className={cn(
                "space-y-4",
                index > 0 ? "pt-6" : ""
              )}
            >
              {/* Category Header */}
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-text-main flex items-center gap-1.5 uppercase tracking-wider">
                  <span>{label}</span>
                  <span className="text-[9px] text-text-dim bg-bg-elevated px-2 py-0.5 rounded-full font-extrabold">
                    {catSkills.length}
                  </span>
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditCategory(cat, label, catSkills)}
                  className="h-8 px-2.5 text-xs font-semibold text-primary hover:bg-primary/10 flex items-center gap-1.5 cursor-pointer rounded-lg border border-primary/20 hover:border-primary/45 transition-colors"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </Button>
              </div>

              {/* Skills Grid */}
              <div className="flex flex-wrap gap-2.5">
                {catSkills.map((s: any) => (
                  <div
                    key={s.id}
                    className="flex flex-col items-center bg-bg-main border border-border/80 rounded-xl px-3.5 py-2.5 min-w-[100px] text-center shadow-xs transition-transform hover:-translate-y-0.5"
                  >
                    <span className="text-xs font-bold text-text-main">{s.name}</span>
                    <span className="text-[9px] text-text-muted mt-1.5 flex items-center gap-1.5 font-extrabold uppercase tracking-wider">
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          s.level === "ADVANCED"
                            ? "bg-green-500"
                            : s.level === "INTERMEDIATE"
                            ? "bg-orange-500"
                            : "bg-blue-500"
                        )}
                      />
                      {s.level.toLowerCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedCategory && (
        <EditCategorySkillsModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          category={selectedCategory.category}
          categoryLabel={selectedCategory.categoryLabel}
          skills={selectedCategory.skills}
        />
      )}
    </div>
  );
}
