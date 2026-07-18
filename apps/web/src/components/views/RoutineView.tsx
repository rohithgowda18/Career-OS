import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { routineApi, RoutineTaskData } from "@/lib/api/routineApi";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  CheckSquare,
  Square,
  Plus,
  Loader2,
  Trash2,
  Edit2,
  ListTodo,
  Calendar,
  Flame,
  Award,
  TrendingUp
} from "lucide-react";

const WEEKDAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const DAY_LABELS: Record<string, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun"
};

export default function RoutineView() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<RoutineTaskData | null>(null);

  // Form states
  const [taskTitle, setTaskTitle] = useState("");
  const [editTitle, setEditTitle] = useState("");

  // Fetch routines
  const { data: routines = [], isLoading: isLoadingRoutines } = useQuery({
    queryKey: ["routines"],
    queryFn: routineApi.list,
  });

  // Fetch reports
  const { data: report, isLoading: isLoadingReports } = useQuery({
    queryKey: ["routines", "reports"],
    queryFn: routineApi.reports,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!taskTitle.trim()) throw new Error("Task title is required");
      const order = routines.length;
      return routineApi.create(taskTitle.trim(), order);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] });
      toast.success("Task added to routine");
      setShowAddModal(false);
      setTaskTitle("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add task");
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTask) return;
      if (!editTitle.trim()) throw new Error("Task title is required");
      return routineApi.update(selectedTask.id, editTitle.trim(), selectedTask.displayOrder);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] });
      toast.success("Task updated");
      setShowEditModal(false);
      setSelectedTask(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update task");
    }
  });

  // Toggle mutation
  const toggleMutation = useMutation({
    mutationFn: routineApi.toggle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to toggle task");
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: routineApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] });
      toast.success("Task removed from routine");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete task");
    }
  });

  const handleEditClick = (task: RoutineTaskData) => {
    setSelectedTask(task);
    setEditTitle(task.title);
    setShowEditModal(true);
  };

  const handleDeleteClick = (id: number) => {
    if (confirm("Are you sure you want to remove this task from your daily routine?")) {
      deleteMutation.mutate(id);
    }
  };

  const completedCount = routines.filter(r => r.completed).length;
  const totalCount = routines.length;
  const todayProgressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const weeklyCompletion = report?.weeklyCompletion || {};
  const weeklyAverage = report?.weeklyAverage || 0;
  const currentStreak = report?.currentStreak || 0;
  const longestStreak = report?.longestStreak || 0;
  const bestDay = report?.bestDay ? (DAY_LABELS[report.bestDay] || report.bestDay) : "N/A";

  const isLoading = isLoadingRoutines || isLoadingReports;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Title / Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-bg-elevated border border-border flex items-center justify-center">
            <ListTodo className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight">Daily Routine</h2>
            <p className="text-[10px] text-text-dim mt-0.5">
              Set up a reusable daily study and career preparation checklist
            </p>
          </div>
        </div>

        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-primary hover:bg-primary-hover text-white font-semibold text-xs h-8.5 px-4 cursor-pointer self-end sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Task
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: My Daily Routine */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-dim">
                My Daily Routine
              </h3>

              {routines.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-border/60 rounded-xl bg-bg-card/20 flex flex-col items-center justify-center">
                  <p className="text-xs text-text-dim font-medium">No routine tasks defined yet.</p>
                  <Button
                    onClick={() => setShowAddModal(true)}
                    variant="link"
                    className="text-xs font-semibold text-primary mt-1.5 h-auto p-0"
                  >
                    Add your first routine task
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {routines.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between bg-bg-card border border-border/60 rounded-xl p-3.5 hover:border-border/80 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => toggleMutation.mutate(task.id)}
                          className="text-text-muted hover:text-primary transition-all shrink-0 cursor-pointer"
                          title={task.completed ? "Mark incomplete" : "Mark completed"}
                        >
                          {task.completed ? (
                            <CheckSquare className="w-4.5 h-4.5 text-primary" />
                          ) : (
                            <Square className="w-4.5 h-4.5" />
                          )}
                        </button>
                        <span
                          className={`text-xs font-semibold truncate ${
                            task.completed ? "line-through text-text-dim" : "text-text-main"
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          onClick={() => handleEditClick(task)}
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 hover:bg-bg-elevated cursor-pointer text-text-dim hover:text-text-main"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteClick(task.id)}
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 hover:bg-danger/10 hover:text-danger cursor-pointer text-text-dim"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Progress & Reports */}
          <div className="space-y-6">
            {/* Today's Progress Card */}
            <div className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-dim">
                Today's Progress
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-text-main">
                  <span>Progress</span>
                  <span>{completedCount} / {totalCount} Completed</span>
                </div>
                <div className="w-full h-2 bg-bg-main border border-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${todayProgressPercentage}%` }}
                  />
                </div>
                <p className="text-[10px] text-text-dim mt-1.5 text-right font-medium">
                  {todayProgressPercentage}% completion rate today
                </p>
              </div>
            </div>

            {/* Streak & Metrics Panel */}
            <div className="bg-bg-card border border-border rounded-xl p-5 space-y-4.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-dim flex items-center gap-1">
                Consistency Reports
              </h3>

              <div className="grid grid-cols-2 gap-3.5">
                {/* Current Streak */}
                <div className="bg-bg-main/40 border border-border/50 rounded-xl p-3 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between text-text-muted">
                    <span className="text-[9px] font-bold uppercase tracking-wider">Current Streak</span>
                    <Flame className="w-4 h-4 text-orange-500 fill-orange-500/20" />
                  </div>
                  <div className="text-lg font-bold text-text-main">
                    {currentStreak} <span className="text-[10px] font-semibold text-text-dim">days</span>
                  </div>
                </div>

                {/* Longest Streak */}
                <div className="bg-bg-main/40 border border-border/50 rounded-xl p-3 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between text-text-muted">
                    <span className="text-[9px] font-bold uppercase tracking-wider">Longest Streak</span>
                    <Award className="w-4 h-4 text-yellow-500" />
                  </div>
                  <div className="text-lg font-bold text-text-main">
                    {longestStreak} <span className="text-[10px] font-semibold text-text-dim">days</span>
                  </div>
                </div>

                {/* Weekly Avg */}
                <div className="bg-bg-main/40 border border-border/50 rounded-xl p-3 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between text-text-muted">
                    <span className="text-[9px] font-bold uppercase tracking-wider">Weekly Avg</span>
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-lg font-bold text-text-main">
                    {weeklyAverage}%
                  </div>
                </div>

                {/* Best Day */}
                <div className="bg-bg-main/40 border border-border/50 rounded-xl p-3 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between text-text-muted">
                    <span className="text-[9px] font-bold uppercase tracking-wider">Best Day</span>
                    <Calendar className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="text-lg font-bold text-text-main">
                    {bestDay}
                  </div>
                </div>
              </div>

              {/* Weekly completion detail lines */}
              <div className="border-t border-border/40 pt-4 space-y-2.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-dim">
                  This Week
                </h4>
                <div className="space-y-2">
                  {WEEKDAYS.map((day) => {
                    const pct = weeklyCompletion[day] ?? 0;
                    return (
                      <div key={day} className="flex items-center justify-between gap-3 text-[10px]">
                        <span className="w-8 font-semibold text-text-muted">{DAY_LABELS[day]}</span>
                        <div className="flex-1 h-1.5 bg-bg-main border border-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-right font-bold text-text-main">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md bg-bg-card border-border text-text-main p-0 overflow-y-auto max-h-[90vh] rounded-xl shadow-2xl">
          <DialogHeader className="p-5 border-b border-border bg-bg-elevated/20">
            <DialogTitle className="text-sm font-semibold">Add Routine Task</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
            className="p-5 space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-[11px] font-semibold text-text-muted">Task Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Solve 2 DSA Problems"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                required
                className="bg-bg-main border-border text-text-main h-10 text-xs font-semibold focus:border-primary/65"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-border/40 mt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAddModal(false)}
                className="text-text-muted hover:text-text-main hover:bg-bg-elevated text-xs font-semibold h-9.5 px-4 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-primary hover:bg-primary-hover text-white font-semibold text-xs h-9.5 px-5 cursor-pointer"
              >
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                Add Task
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Task Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md bg-bg-card border-border text-text-main p-0 overflow-y-auto max-h-[90vh] rounded-xl shadow-2xl">
          <DialogHeader className="p-5 border-b border-border bg-bg-elevated/20">
            <DialogTitle className="text-sm font-semibold">Modify Routine Task</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate();
            }}
            className="p-5 space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="editTitle" className="text-[11px] font-semibold text-text-muted">Task Title *</Label>
              <Input
                id="editTitle"
                placeholder="e.g. Solve 2 DSA Problems"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                className="bg-bg-main border-border text-text-main h-10 text-xs font-semibold focus:border-primary/65"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-border/40 mt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowEditModal(false)}
                className="text-text-muted hover:text-text-main hover:bg-bg-elevated text-xs font-semibold h-9.5 px-4 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-primary hover:bg-primary-hover text-white font-semibold text-xs h-9.5 px-5 cursor-pointer"
              >
                {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
