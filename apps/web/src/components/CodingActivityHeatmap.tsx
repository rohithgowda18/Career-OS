import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { codingApi, Platform, ActivitySummaryDTO, DailyActivityDTO } from "@/lib/api/codingApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Calendar, Flame, Trophy, Activity, Loader2, Sparkles, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodingActivityHeatmapProps {
  className?: string;
}

const PLATFORM_LABELS: Record<string, string> = {
  LEETCODE: "LeetCode",
  CODEFORCES: "Codeforces",
  CODECHEF: "CodeChef",
  HACKERRANK: "HackerRank",
  GEEKSFORGEEKS: "GeeksforGeeks",
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getIntensityClass(count: number): string {
  if (count === 0) return "bg-bg-elevated/40 border border-white/5";
  if (count <= 2) return "bg-primary/25 border border-primary/35";
  if (count <= 5) return "bg-primary/50 border border-primary/60";
  if (count <= 10) return "bg-primary/75 border border-primary/80";
  return "bg-primary border border-primary/90 shadow-xs";
}

export default function CodingActivityHeatmap({ className }: CodingActivityHeatmapProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("ALL");

  const filterPlatformParam = selectedPlatform === "ALL" ? undefined : (selectedPlatform as Platform);

  const { data: activityData, isLoading, isError } = useQuery({
    queryKey: ["coding", "activity", selectedYear, selectedPlatform],
    queryFn: () => codingApi.getActivitySummary(selectedYear, filterPlatformParam),
  });

  // Map activities by date string "YYYY-MM-DD"
  const activityMap = useMemo(() => {
    const map = new Map<string, DailyActivityDTO>();
    if (activityData?.dailyActivities) {
      activityData.dailyActivities.forEach((act) => {
        map.set(act.date, act);
      });
    }
    return map;
  }, [activityData]);

  // Generate 52/53 weeks calendar matrix for selected year
  const { weeks, monthLabels } = useMemo(() => {
    const startDate = new Date(selectedYear, 0, 1);
    const endDate = new Date(selectedYear, 11, 31);

    // Adjust start to the preceding Sunday
    const firstDayOfWeek = startDate.getDay();
    const calendarStart = new Date(startDate);
    calendarStart.setDate(startDate.getDate() - firstDayOfWeek);

    // Adjust end to the following Saturday
    const lastDayOfWeek = endDate.getDay();
    const calendarEnd = new Date(endDate);
    calendarEnd.setDate(endDate.getDate() + (6 - lastDayOfWeek));

    const weeksList: { date: Date; dateStr: string; inYear: boolean }[][] = [];
    let currentWeek: { date: Date; dateStr: string; inYear: boolean }[] = [];
    const monthsPos: { month: string; weekIndex: number }[] = [];
    let lastSeenMonth = -1;

    const curr = new Date(calendarStart);
    let weekIdx = 0;

    while (curr <= calendarEnd) {
      const year = curr.getFullYear();
      const month = curr.getMonth();
      const monthStr = String(month + 1).padStart(2, "0");
      const dayStr = String(curr.getDate()).padStart(2, "0");
      const dateStr = `${year}-${monthStr}-${dayStr}`;

      const inYear = year === selectedYear;

      if (inYear && month !== lastSeenMonth && currentWeek.length === 0) {
        monthsPos.push({ month: MONTH_NAMES[month], weekIndex: weekIdx });
        lastSeenMonth = month;
      }

      currentWeek.push({
        date: new Date(curr),
        dateStr,
        inYear,
      });

      if (currentWeek.length === 7) {
        weeksList.push(currentWeek);
        currentWeek = [];
        weekIdx++;
      }

      curr.setDate(curr.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      weeksList.push(currentWeek);
    }

    return { weeks: weeksList, monthLabels: monthsPos };
  }, [selectedYear]);

  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  return (
    <div className={cn("bg-bg-card border border-border/80 rounded-2xl p-5 space-y-4 shadow-sm", className)}>
      {/* Header with Title and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
              Coding Activity
              <span className="text-xs font-normal text-text-dim">
                (Unique Problems Solved)
              </span>
            </h3>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2">
          <Select
            value={selectedPlatform}
            onValueChange={(val) => setSelectedPlatform(val)}
          >
            <SelectTrigger className="w-[140px] h-8 text-xs bg-bg-elevated/60 border-border">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent className="bg-bg-card border-border text-text-main text-xs">
              <SelectItem value="ALL">All Platforms</SelectItem>
              <SelectItem value="LEETCODE">LeetCode</SelectItem>
              <SelectItem value="CODEFORCES">Codeforces</SelectItem>
              <SelectItem value="CODECHEF">CodeChef</SelectItem>
              <SelectItem value="HACKERRANK">HackerRank</SelectItem>
              <SelectItem value="GEEKSFORGEEKS">GeeksforGeeks</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={String(selectedYear)}
            onValueChange={(val) => setSelectedYear(Number(val))}
          >
            <SelectTrigger className="w-[90px] h-8 text-xs bg-bg-elevated/60 border-border font-medium">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent className="bg-bg-card border-border text-text-main text-xs">
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-bg-elevated/30 border border-border/60">
          <span className="text-[10px] font-semibold text-text-dim uppercase tracking-wider block">
            Solved in {selectedYear}
          </span>
          <div className="text-xl font-black text-text-main mt-0.5">
            {(activityData?.totalSolvedInYear || 0).toLocaleString()}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-bg-elevated/30 border border-border/60">
          <span className="text-[10px] font-semibold text-text-dim uppercase tracking-wider block">
            Active Days
          </span>
          <div className="text-xl font-black text-primary mt-0.5">
            {activityData?.totalActiveDays || 0}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-bg-elevated/30 border border-border/60">
          <span className="text-[10px] font-semibold text-text-dim uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3 h-3 text-warning" /> Current Streak
          </span>
          <div className="text-xl font-black text-warning mt-0.5">
            {activityData?.currentStreak || 0} <span className="text-xs font-medium text-text-dim">days</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-bg-elevated/30 border border-border/60">
          <span className="text-[10px] font-semibold text-text-dim uppercase tracking-wider flex items-center gap-1">
            <Trophy className="w-3 h-3 text-success" /> Max Streak
          </span>
          <div className="text-xl font-black text-success mt-0.5">
            {activityData?.maxStreak || 0} <span className="text-xs font-medium text-text-dim">days</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid Container */}
      <div className="relative overflow-x-auto pb-2 pt-1 scrollbar-thin">
        {isLoading ? (
          <div className="h-36 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-xs text-text-dim">Loading contribution activity...</span>
          </div>
        ) : (
          <div className="min-w-[720px] space-y-1.5 select-none">
            {/* Months Header Labels */}
            <div className="flex text-[10px] text-text-dim pl-7 mb-1">
              {weeks.map((week, idx) => {
                const firstDayOfWeek = week[0];
                const isFirstWeekOfMonth = firstDayOfWeek.date.getDate() <= 7 && firstDayOfWeek.inYear;
                return (
                  <div key={idx} className="w-3 mr-1 text-center font-medium">
                    {isFirstWeekOfMonth ? MONTH_NAMES[firstDayOfWeek.date.getMonth()] : ""}
                  </div>
                );
              })}
            </div>

            {/* Days Matrix (7 rows x N weeks) */}
            <div className="flex items-start gap-1">
              {/* Day Labels Column */}
              <div className="flex flex-col gap-1 pr-1.5 text-[9px] text-text-dim font-medium justify-between h-[104px]">
                <span className="h-3 leading-3">Mon</span>
                <span className="h-3 leading-3">Wed</span>
                <span className="h-3 leading-3">Fri</span>
              </div>

              {/* Week Columns */}
              <div className="flex gap-1">
                {weeks.map((week, weekIdx) => (
                  <div key={weekIdx} className="flex flex-col gap-1">
                    {week.map((day) => {
                      const activity = activityMap.get(day.dateStr);
                      const count = activity?.totalSolved || 0;
                      const formattedDate = day.date.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });

                      if (!day.inYear) {
                        return <div key={day.dateStr} className="w-3 h-3 opacity-0 pointer-events-none" />;
                      }

                      return (
                        <Tooltip key={day.dateStr}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "w-3 h-3 rounded-[2.5px] cursor-pointer transition-transform hover:scale-125",
                                getIntensityClass(count)
                              )}
                            />
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="bg-bg-card border border-border/80 text-text-main p-2.5 rounded-xl shadow-lg space-y-1 text-xs"
                          >
                            <div className="font-bold text-text-main text-[11px]">{formattedDate}</div>
                            <div className="text-[12px] font-semibold text-primary">
                              {count} unique {count === 1 ? "problem" : "problems"} solved
                            </div>
                            {activity?.breakdown && Object.keys(activity.breakdown).length > 0 && (
                              <div className="pt-1 border-t border-border/50 space-y-0.5 text-[10px] text-text-dim">
                                {Object.entries(activity.breakdown).map(([plat, pCount]) => (
                                  <div key={plat} className="flex items-center justify-between gap-3">
                                    <span>{PLATFORM_LABELS[plat] || plat}:</span>
                                    <span className="font-bold text-text-main">{pCount}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Legend */}
      <div className="flex items-center justify-between pt-1 border-t border-border/30 text-xs text-text-dim">
        <span className="text-[11px]">Daily unique problems solved across verified accounts</span>
        <div className="flex items-center gap-1.5 text-[10px]">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded-[2px] bg-bg-elevated/40 border border-white/5" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-primary/25 border border-primary/35" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-primary/50 border border-primary/60" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-primary/75 border border-primary/80" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-primary border border-primary/90" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
