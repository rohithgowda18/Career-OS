import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { skillsApi } from "@/lib/api/skillsApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SkillTable from "@/components/SkillTable";
import AddSkillModal from "@/components/AddSkillModal";
import {
  Award,
  Code,
  Layers,
  Database,
  Wrench,
  BookOpen,
  Plus,
  Search,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

export default function SkillsPage() {
  const { themeTokens } = useTheme();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const pageSize = 10;

  // Fetch all skills for calculating the dashboard stats at the top
  const allSkillsQuery = useQuery({
    queryKey: ["skills", "all"],
    queryFn: () => skillsApi.list({ page: 0, size: 1000 }),
  });

  const skills = allSkillsQuery.data?.content || [];

  const stats = {
    total: skills.length,
    languages: skills.filter((s: any) => s.category === "PROGRAMMING_LANGUAGE").length,
    frameworks: skills.filter((s: any) => s.category === "FRAMEWORK").length,
    databases: skills.filter((s: any) => s.category === "DATABASE").length,
    tools: skills.filter((s: any) => s.category === "TOOL").length,
    concepts: skills.filter((s: any) => s.category === "CONCEPT").length,
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Header section */}
      <div className="border-b border-border/60 pb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] sm:text-[32px] font-bold tracking-tight text-text-main">
            My Skills
          </h2>
          <p className="text-xs text-text-dim mt-0.5">Maintain and track your technical competencies and skill levels</p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold h-9 px-4 shrink-0 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Skill
        </Button>
      </div>

      {/* Dashboard Stats */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim">Dashboard Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Total Skills", value: stats.total, icon: <Award className="w-4 h-4 text-primary" /> },
            { label: "Programming", value: stats.languages, icon: <Code className="w-4 h-4 text-success" /> },
            { label: "Frameworks", value: stats.frameworks, icon: <Layers className="w-4 h-4 text-info" /> },
            { label: "Databases", value: stats.databases, icon: <Database className="w-4 h-4 text-warning" /> },
            { label: "Tools", value: stats.tools, icon: <Wrench className="w-4 h-4 text-text-muted" /> },
            { label: "Concepts", value: stats.concepts, icon: <BookOpen className="w-4 h-4 text-accent" /> },
          ].map(item => (
            <div key={item.label} className="bg-bg-card border border-border rounded-xl p-4 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold text-text-dim uppercase tracking-wider">{item.label}</span>
                {item.icon}
              </div>
              <p className="text-xl font-semibold tracking-tight text-text-main">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Search and Table Area */}
      <div className="space-y-4">
        <div className="flex items-center relative max-w-sm">
          <Search className="absolute left-3 w-4 h-4 text-text-dim" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search by Skill Name..."
            className="pl-9 bg-bg-card border-border text-text-main h-10 text-xs font-semibold focus:border-primary/65"
          />
        </div>

        <SkillTable
          page={page}
          setPage={setPage}
          pageSize={pageSize}
          search={search}
        />
      </div>

      {/* Optional Insights Section */}
      <div className="bg-bg-card border border-border rounded-xl p-5 shadow-xs">
        <h3 className="text-sm font-semibold text-text-main flex items-center gap-1.5 mb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>Coming Soon</span>
        </h3>
        <p className="text-xs text-text-dim leading-relaxed mb-3">
          This is an informational placeholder card. Future updates will utilize your registered skills to offer:
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-text-muted">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>Skill Gap Analysis</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>Learning Recommendations</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>Interview Questions</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>Placement Readiness</span>
          </li>
        </ul>
      </div>

      {/* Modal trigger */}
      <AddSkillModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        existingSkills={skills}
      />
    </div>
  );
}
