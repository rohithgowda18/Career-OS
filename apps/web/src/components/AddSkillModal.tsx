import { useState, useMemo } from "react";
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
import { Loader2, Plus, ArrowLeft, Check, Search, ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { SKILL_CATALOG, CatalogSkill, RECOMMENDATION_MAP } from "@/lib/constants/skillCatalog";

interface AddSkillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingSkills?: any[];
}

const CATEGORY_LABELS: Record<string, string> = {
  BACKEND: "Backend",
  FRONTEND: "Frontend",
  DATABASE: "Database",
  DEVOPS: "DevOps",
  CLOUD: "Cloud",
  COMPUTER_SCIENCE: "Computer Science",
  AI_ML: "AI / Machine Learning",
  MOBILE: "Mobile",
  TESTING: "Testing",
  OTHER: "Others",
};

const POPULAR_SKILLS = ["Java", "Spring Boot", "React", "PostgreSQL", "Git", "Docker", "REST APIs", "JWT", "Linux"];

const CAREER_TRACKS = [
  {
    name: "Backend Developer",
    skills: ["Java", "Spring Boot", "Hibernate", "PostgreSQL", "REST APIs", "JWT", "Git", "Maven", "Linux", "Postman"]
  },
  {
    name: "Frontend Developer",
    skills: ["HTML", "CSS", "JavaScript", "TypeScript", "React", "TailwindCSS", "Vite", "VS Code", "Git", "Postman"]
  },
  {
    name: "Full Stack",
    skills: ["React", "Node.js", "Express", "MongoDB", "Java", "Spring Boot", "PostgreSQL", "TypeScript", "Git", "Docker"]
  },
  {
    name: "AI/ML",
    skills: ["Python", "Algorithms", "Data Structures", "Machine Learning", "Artificial Intelligence", "PyTorch", "R"]
  },
  {
    name: "DevOps",
    skills: ["Docker", "Kubernetes", "Jenkins", "Git", "Linux", "AWS", "Terraform", "CI/CD"]
  },
  {
    name: "Mobile Developer",
    skills: ["Kotlin", "Swift", "Flutter", "React Native", "Git"]
  },
  {
    name: "Cyber Security",
    skills: ["Cryptography", "Computer Networks", "Operating Systems", "Linux", "JWT", "OAuth2"]
  }
];

export default function AddSkillModal({ open, onOpenChange, existingSkills = [] }: AddSkillModalProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<CatalogSkill[]>([]);
  const [selectedLevel, setSelectedLevel] = useState("INTERMEDIATE");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Accordion state
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    BACKEND: true, // Backend open by default
  });

  // Custom Form state
  const [customForm, setCustomForm] = useState({
    name: "",
    category: "BACKEND",
    level: "INTERMEDIATE",
  });

  // Normalize existing skill names for quick lookup
  const existingNamesSet = useMemo(() => {
    return new Set(existingSkills.map(s => s.name.toLowerCase().trim()));
  }, [existingSkills]);

  // Filter and group catalog skills
  const groupedSkills = useMemo(() => {
    const filtered = SKILL_CATALOG.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groups: Record<string, CatalogSkill[]> = {};
    Object.keys(CATEGORY_LABELS).forEach(cat => {
      groups[cat] = [];
    });

    filtered.forEach(s => {
      if (groups[s.category]) {
        groups[s.category].push(s);
      }
    });

    return groups;
  }, [searchQuery]);

  // Handle smart suggestions based on selected skills
  const suggestions = useMemo(() => {
    const selectedNames = selectedSkills.map(s => s.name);
    const suggestedList: CatalogSkill[] = [];

    selectedNames.forEach(name => {
      const candidates = RECOMMENDATION_MAP[name] || [];
      candidates.forEach(cname => {
        const found = SKILL_CATALOG.find(s => s.name === cname);
        if (found && !selectedNames.includes(cname) && !existingNamesSet.has(cname.toLowerCase()) && !suggestedList.some(item => item.name === cname)) {
          suggestedList.push(found);
        }
      });
    });

    return suggestedList;
  }, [selectedSkills, existingNamesSet]);

  const toggleSkillSelection = (skill: CatalogSkill) => {
    const isSelected = selectedSkills.some(s => s.name === skill.name);
    if (isSelected) {
      setSelectedSkills(selectedSkills.filter(s => s.name !== skill.name));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const applyTrackPreset = (skillsList: string[]) => {
    const toSelect: CatalogSkill[] = [];
    skillsList.forEach(name => {
      const catalogItem = SKILL_CATALOG.find(s => s.name.toLowerCase() === name.toLowerCase());
      if (catalogItem && !existingNamesSet.has(name.toLowerCase())) {
        toSelect.push(catalogItem);
      }
    });
    setSelectedSkills(toSelect);
    toast.success(`Pre-selected ${toSelect.length} track skills`);
  };

  const handleBatchAdd = async () => {
    if (selectedSkills.length === 0) return;
    setIsAdding(true);
    const loadingToast = toast.loading(`Adding ${selectedSkills.length} skill(s)...`);

    try {
      await Promise.all(
        selectedSkills.map(s =>
          skillsApi.create({
            name: s.name,
            category: s.category,
            level: selectedLevel,
          })
        )
      );
      toast.dismiss(loadingToast);
      toast.success("Skills added successfully");
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      setSelectedSkills([]);
      setSearchQuery("");
      onOpenChange(false);
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.message || "Failed to add skills");
    } finally {
      setIsAdding(false);
    }
  };

  const handleCustomAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customForm.name.trim()) {
      toast.error("Skill name is required");
      return;
    }
    const name = customForm.name.trim();
    if (existingNamesSet.has(name.toLowerCase())) {
      toast.error("You have already added this skill: " + name);
      return;
    }

    setIsAdding(true);
    try {
      await skillsApi.create({
        name,
        category: customForm.category,
        level: customForm.level,
      });
      toast.success("Custom skill added successfully");
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      setCustomForm({ name: "", category: "BACKEND", level: "INTERMEDIATE" });
      setShowCustomForm(false);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to add custom skill");
    } finally {
      setIsAdding(false);
    }
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-bg-card border-border text-text-main p-0 overflow-hidden rounded-xl flex flex-col max-h-[90vh]">
        <DialogHeader className="p-5 border-b border-border/60 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            {showCustomForm && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCustomForm(false)}
                className="h-8 w-8 text-text-dim hover:text-text-main cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <DialogTitle className="text-sm font-semibold">
              {showCustomForm ? "Add Custom Skill" : "Add Skills to Career OS"}
            </DialogTitle>
          </div>
          {!showCustomForm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomForm(true)}
              className="text-xs border-primary/20 bg-primary/10 hover:bg-primary/15 text-primary h-8 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Custom Skill
            </Button>
          )}
        </DialogHeader>

        {showCustomForm ? (
          /* MANUAL CUSTOM ENTRY FORM */
          <form onSubmit={handleCustomAdd} className="p-5 space-y-4 flex-1 overflow-y-auto">
            <div className="space-y-1.5">
              <Label htmlFor="custom-name" className="text-[11px] font-semibold text-text-muted">Skill Name</Label>
              <Input
                id="custom-name"
                value={customForm.name}
                onChange={e => setCustomForm({ ...customForm, name: e.target.value })}
                placeholder="e.g. Kubernetes, WebGL, Rust"
                className="bg-bg-main border-border text-text-main h-10 text-xs font-semibold focus:border-primary/65"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="custom-category" className="text-[11px] font-semibold text-text-muted">Category</Label>
                <Select
                  value={customForm.category}
                  onValueChange={v => setCustomForm({ ...customForm, category: v })}
                >
                  <SelectTrigger className="bg-bg-main border-border h-10 text-xs text-text-main">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-bg-card border-border text-text-main">
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="custom-level" className="text-[11px] font-semibold text-text-muted">Level</Label>
                <Select
                  value={customForm.level}
                  onValueChange={v => setCustomForm({ ...customForm, level: v })}
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

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCustomForm(false)}
                className="bg-bg-elevated/40 border-border text-xs text-text-muted hover:text-text-main h-9 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isAdding}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold h-9 cursor-pointer"
              >
                {isAdding && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Add Custom Skill
              </Button>
            </div>
          </form>
        ) : (
          /* PREDEFINED CATALOG VIEW */
          <div className="flex flex-col flex-1 min-h-0">
            {/* Search inputs */}
            <div className="p-4 border-b border-border/40 relative">
              <Search className="absolute left-7 top-7 w-4 h-4 text-text-dim" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search catalog skills (e.g. spring, react, docker)..."
                className="pl-10 bg-bg-main border-border text-text-main h-10 text-xs font-semibold focus:border-primary/65"
              />
            </div>

            {/* Scrollable Main Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* 1. Quick Start Tracks */}
              {searchQuery === "" && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Choose a Track (Quick Start)</h4>
                  <div className="flex flex-wrap gap-2">
                    {CAREER_TRACKS.map(track => (
                      <button
                        key={track.name}
                        type="button"
                        onClick={() => applyTrackPreset(track.skills)}
                        className="px-3 py-1.5 text-[11px] font-bold border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary rounded-lg transition-colors cursor-pointer text-left"
                      >
                        <div>{track.name}</div>
                        <div className="text-[9px] text-primary/75 font-semibold mt-0.5">{track.skills.length} Skills</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Popular Skills */}
              {searchQuery === "" && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-text-dim uppercase tracking-wider flex items-center gap-1">
                    <span>⭐ Popular Skills</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_SKILLS.map(name => {
                      const catalogItem = SKILL_CATALOG.find(s => s.name === name);
                      if (!catalogItem) return null;
                      const isAdded = existingNamesSet.has(name.toLowerCase());
                      const isSelected = selectedSkills.some(s => s.name === name);
                      return (
                        <button
                          key={name}
                          type="button"
                          disabled={isAdded}
                          onClick={() => toggleSkillSelection(catalogItem)}
                          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border rounded-lg transition-all cursor-pointer ${
                            isAdded
                              ? "bg-green-500/10 border-green-500/25 text-green-500/80 cursor-not-allowed"
                              : isSelected
                              ? "bg-primary/10 border-primary text-primary"
                              : "bg-bg-main border-border text-text-muted hover:border-text-muted/40 hover:text-text-main"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 shrink-0" />}
                          <span>{name}</span>
                          {isAdded && (
                            <span className="ml-1 text-[8px] font-bold uppercase tracking-wider text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-full shrink-0">
                              ✓ Added
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Smart Suggestions */}
              {suggestions.length > 0 && searchQuery === "" && (
                <div className="space-y-2 p-3 bg-primary/5 border border-primary/10 rounded-xl animate-in fade-in duration-200">
                  <h4 className="text-[10px] font-bold text-primary flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Recommended for You</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map(s => (
                      <button
                        key={s.name}
                        type="button"
                        onClick={() => toggleSkillSelection(s)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold border border-primary/20 bg-bg-card hover:bg-primary/10 text-text-main rounded-lg transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3 text-primary" />
                        <span>{s.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Collapsible Domain Categories */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-text-dim uppercase tracking-wider">
                  {searchQuery !== "" ? "Search Results" : "All Skills (Browse)"}
                </h4>
                
                {Object.entries(groupedSkills).map(([cat, skills]) => {
                  if (skills.length === 0) return null;
                  const isExpanded = expandedCategories[cat] || searchQuery !== "";
                  const count = skills.length;

                  return (
                    <div key={cat} className="border border-border/50 rounded-xl overflow-hidden bg-bg-main/30">
                      <button
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className="w-full flex items-center justify-between p-3.5 bg-bg-card/75 border-b border-border/30 hover:bg-bg-elevated/40 transition-colors text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5">
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-text-dim" /> : <ChevronRight className="w-4 h-4 text-text-dim" />}
                          <span className="text-xs font-bold text-text-main">
                            {CATEGORY_LABELS[cat]}
                          </span>
                        </div>
                        <span className="text-[10px] font-extrabold text-text-dim bg-bg-elevated px-2 py-0.5 rounded-full">
                          {count}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="p-4 flex flex-wrap gap-1.5 bg-bg-card/25 transition-all">
                          {skills.map(s => {
                            const isAdded = existingNamesSet.has(s.name.toLowerCase().trim());
                            const isSelected = selectedSkills.some(item => item.name === s.name);

                            return (
                              <button
                                key={s.name}
                                type="button"
                                disabled={isAdded}
                                onClick={() => toggleSkillSelection(s)}
                                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border rounded-lg transition-all cursor-pointer ${
                                  isAdded
                                    ? "bg-green-500/10 border-green-500/25 text-green-500/80 cursor-not-allowed"
                                    : isSelected
                                    ? "bg-primary/10 border-primary text-primary"
                                    : "bg-bg-main border-border text-text-muted hover:border-text-muted/40 hover:text-text-main"
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 shrink-0" />}
                                <span>{s.name}</span>
                                {isAdded && (
                                  <span className="ml-1 text-[8px] font-bold uppercase tracking-wider text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-full shrink-0">
                                    ✓ Added
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer containing level selection and batch save actions */}
            <div className="p-4 border-t border-border/60 bg-bg-main/50 space-y-4">
              {selectedSkills.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-semibold text-text-muted">Skill Level for Selected:</Label>
                    <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                      <SelectTrigger className="w-36 h-8 text-xs bg-bg-card border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-bg-card border-border text-text-main">
                        <SelectItem value="BEGINNER">Beginner</SelectItem>
                        <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                        <SelectItem value="ADVANCED">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-xs text-text-muted">
                    Selected: <span className="font-bold text-primary">{selectedSkills.length}</span> skill(s)
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
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
                  disabled={selectedSkills.length === 0 || isAdding}
                  onClick={handleBatchAdd}
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold h-9 cursor-pointer"
                >
                  {isAdding && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                  Save {selectedSkills.length > 0 ? `${selectedSkills.length} Skill(s)` : "Skills"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
