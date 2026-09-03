import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { codingApi, CodingStatsResponse, CodingStatsHistoryDTO, ConnectAccountResponse } from "@/lib/api/codingApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import ConnectCodingModal from "./ConnectCodingModal";
import { toast } from "sonner";
import {
  Code2,
  RefreshCw,
  Unlink,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  Plus,
  Loader2,
  Award,
  Calendar,
  AlertCircle,
  MoreVertical,
  ChevronRight,
  Flame,
  ArrowUpRight
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import { cn } from "@/lib/utils";

// Format helper for last synced timestamp
function formatSyncTime(dateStr?: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return "Synced just now";
  if (diffSec < 3600) return `Synced ${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `Synced ${Math.floor(diffSec / 3600)}h ago`;
  return `Synced on ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

// Custom Tooltip for Multi-point Chart
function CustomChartTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;

  return (
    <div className="bg-bg-card border border-border shadow-xl rounded-xl p-3 text-xs space-y-1.5 z-50">
      <div className="font-semibold text-text-main flex items-center gap-1.5 border-b border-border/50 pb-1">
        <Calendar className="w-3.5 h-3.5 text-primary" />
        {data.fullDate}
      </div>
      <div className="font-bold text-primary text-sm">
        {data.solved} problems solved
      </div>
      {(data.easy > 0 || data.medium > 0 || data.hard > 0) && (
        <div className="flex items-center gap-2 pt-1 text-[11px] text-text-dim">
          <span className="text-success font-medium">Easy: {data.easy}</span>
          <span>•</span>
          <span className="text-warning font-medium">Med: {data.medium}</span>
          <span>•</span>
          <span className="text-danger font-medium">Hard: {data.hard}</span>
        </div>
      )}
    </div>
  );
}

export default function CodingProfileCard() {
  const queryClient = useQueryClient();
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [pendingAccountToVerify, setPendingAccountToVerify] = useState<ConnectAccountResponse | null>(null);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [accountToDisconnect, setAccountToDisconnect] = useState<number | null>(null);

  // Queries
  const {
    data: statsMap,
    isLoading: isLoadingStats,
    isError: isErrorStats,
    refetch: refetchStats
  } = useQuery({
    queryKey: ["coding", "stats"],
    queryFn: codingApi.getCurrentStats,
  });

  const {
    data: historyData,
    isLoading: isLoadingHistory,
    isError: isErrorHistory,
    refetch: refetchHistory
  } = useQuery({
    queryKey: ["coding", "history"],
    queryFn: codingApi.getStatsHistory,
  });

  const { data: accounts } = useQuery({
    queryKey: ["coding", "accounts"],
    queryFn: codingApi.getAccounts,
  });

  // LeetCode data
  const leetcodeStats = statsMap?.leetcode;
  const leetcodeAccount = (accounts || []).find((a) => a.platform === "LEETCODE");
  const isVerified = leetcodeStats?.verificationStatus === "VERIFIED";

  // Mutations
  const syncMutation = useMutation({
    mutationFn: (accountId: number) => codingApi.syncStats(accountId),
    onSuccess: (data) => {
      toast.success(`Synchronized ${data.totalSolved} solved problems from LeetCode!`);
      queryClient.invalidateQueries({ queryKey: ["coding"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to sync LeetCode stats");
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (accountId: number) => codingApi.disconnectAccount(accountId),
    onSuccess: () => {
      toast.success("LeetCode account disconnected");
      setShowDisconnectConfirm(false);
      setAccountToDisconnect(null);
      queryClient.invalidateQueries({ queryKey: ["coding"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to disconnect account");
    },
  });

  const confirmDisconnect = (accountId: number) => {
    setAccountToDisconnect(accountId);
    setShowDisconnectConfirm(true);
  };

  const formattedHistory = useMemo(() => {
    return (historyData || []).map((item) => {
      const d = new Date(item.recordedAt);
      return {
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        fullDate: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        solved: item.totalSolved,
        easy: item.easy,
        medium: item.medium,
        hard: item.hard,
      };
    });
  }, [historyData]);

  // Real Progress Delta (only if 2+ records exist)
  const progressDelta = useMemo(() => {
    if (formattedHistory.length < 2) return null;
    const latest = formattedHistory[formattedHistory.length - 1].solved;
    const previous = formattedHistory[formattedHistory.length - 2].solved;
    const diff = latest - previous;
    return {
      diff,
      isPositive: diff >= 0,
    };
  }, [formattedHistory]);

  // Loading State Skeleton
  if (isLoadingStats) {
    return (
      <Card className="bg-bg-card border-border/80 rounded-2xl overflow-hidden shadow-sm">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-bg-elevated animate-pulse" />
              <div className="space-y-1">
                <div className="w-28 h-4 bg-bg-elevated animate-pulse rounded" />
                <div className="w-48 h-3 bg-bg-elevated animate-pulse rounded" />
              </div>
            </div>
            <div className="w-24 h-8 bg-bg-elevated animate-pulse rounded-lg" />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-10 space-y-3">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
            <p className="text-xs text-text-dim">Loading coding profile...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error State
  if (isErrorStats) {
    return (
      <Card className="bg-bg-card border-border/80 rounded-2xl overflow-hidden shadow-sm">
        <CardContent className="p-6">
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-text-main">Unable to load coding profile</h4>
            <p className="text-xs text-text-dim max-w-sm mx-auto">
              There was an issue communicating with the coding service. Please check your connection and try again.
            </p>
            <Button
              size="sm"
              onClick={() => refetchStats()}
              className="mt-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold cursor-pointer"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-bg-card border-border/80 rounded-2xl overflow-hidden shadow-sm">
        {/* 1. Header */}
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-warning/10 border border-warning/20 flex items-center justify-center text-warning shrink-0">
                <Code2 className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-text-main flex items-center gap-2">
                  Coding Profile
                  <Badge variant="outline" className="text-[10px] font-semibold bg-bg-elevated text-text-dim border-border">
                    LeetCode
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-text-dim">
                  Live problem solving metrics, difficulty distribution, and activity
                </CardDescription>
              </div>
            </div>

            {/* Unconnected Action */}
            {!leetcodeStats && !leetcodeAccount && (
              <Button
                size="sm"
                onClick={() => {
                  setPendingAccountToVerify(null);
                  setIsConnectModalOpen(true);
                }}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold h-8 px-3 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Connect LeetCode
              </Button>
            )}

            {/* Manage Action Dropdown for Connected Accounts */}
            {leetcodeStats?.accountId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-text-dim hover:text-text-main hover:bg-bg-elevated cursor-pointer"
                    title="Manage Account"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 bg-bg-card border-border text-text-main">
                  <DropdownMenuItem
                    onClick={() => leetcodeStats?.accountId && syncMutation.mutate(leetcodeStats.accountId)}
                    disabled={syncMutation.isPending}
                    className="text-xs cursor-pointer hover:bg-bg-elevated"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-2 text-primary" />
                    Sync Now
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => leetcodeStats?.accountId && confirmDisconnect(leetcodeStats.accountId)}
                    className="text-xs text-danger hover:bg-danger/10 cursor-pointer"
                  >
                    <Unlink className="w-3.5 h-3.5 mr-2 text-danger" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-5">
          {/* 9. Unconnected State */}
          {!leetcodeStats && !leetcodeAccount ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-bg-elevated text-text-dim flex items-center justify-center mx-auto">
                <Code2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-text-main">No Coding Account Connected</h4>
              <p className="text-xs text-text-dim max-w-sm mx-auto leading-relaxed">
                Connect your public LeetCode profile to automatically showcase solved problems, difficulty breakdowns, and contest ratings.
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setPendingAccountToVerify(null);
                  setIsConnectModalOpen(true);
                }}
                className="mt-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold cursor-pointer"
              >
                Connect LeetCode
              </Button>
            </div>
          ) : leetcodeAccount && !isVerified ? (
            /* Pending Verification State */
            <div className="p-4 rounded-xl bg-warning/5 border border-warning/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="text-xs font-bold text-text-main">Verification Required</span>
                </div>
                <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/30">
                  Pending Bio Verification
                </Badge>
              </div>

              <p className="text-xs text-text-dim">
                Account <strong className="text-text-main">@{leetcodeAccount.username}</strong> requires verification code placement in your LeetCode profile bio.
              </p>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={() => {
                    setPendingAccountToVerify(leetcodeAccount);
                    setIsConnectModalOpen(true);
                  }}
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold h-8 cursor-pointer"
                >
                  Verify Ownership
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => confirmDisconnect(leetcodeAccount.accountId)}
                  className="text-xs text-danger hover:bg-danger/10 h-8 cursor-pointer"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            /* Verified Profile Display */
            <div className="space-y-6">
              {/* LeetCode Identity Bar & Primary Sync Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-bg-elevated/40 border border-border/60">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-text-main">LeetCode</span>
                    <a
                      href={`https://leetcode.com/u/${leetcodeStats?.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary font-mono hover:underline flex items-center gap-1 font-semibold"
                    >
                      @{leetcodeStats?.username}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/30 flex items-center gap-1 py-0 px-2">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </Badge>
                  </div>
                  {leetcodeStats?.syncedAt && (
                    <p className="text-[11px] text-text-dim flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatSyncTime(leetcodeStats.syncedAt)}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {/* 6. Primary Sync Button */}
                  <Button
                    size="sm"
                    onClick={() => leetcodeStats?.accountId && syncMutation.mutate(leetcodeStats.accountId)}
                    disabled={syncMutation.isPending}
                    className="h-8 px-3.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold cursor-pointer shadow-sm"
                  >
                    {syncMutation.isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                        Sync Now
                      </>
                    )}
                  </Button>

                  {/* 7. Subtle Disconnect Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => leetcodeStats?.accountId && confirmDisconnect(leetcodeStats.accountId)}
                    disabled={disconnectMutation.isPending}
                    className="h-8 px-2.5 text-xs text-text-dim hover:text-danger hover:bg-danger/10 cursor-pointer"
                    title="Disconnect Profile"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* 2. Stats: Hero Metric (Total Problems Solved) + Secondary Breakdowns */}
              <div className="space-y-3">
                {/* Hero Total Metric */}
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-text-dim uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-primary" />
                      Total Problems Solved
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-black text-text-main tracking-tight">
                        {leetcodeStats?.totalSolved || 0}
                      </span>
                      <span className="text-xs text-text-dim font-medium">solved problems</span>
                    </div>
                  </div>

                  {/* 4. Progress summary delta (only if 2+ records) */}
                  {progressDelta && (
                    <div className={cn(
                      "self-start sm:self-auto px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1",
                      progressDelta.isPositive 
                        ? "bg-success/10 text-success border-success/20" 
                        : "bg-warning/10 text-warning border-warning/20"
                    )}>
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>
                        {progressDelta.isPositive ? `+${progressDelta.diff}` : progressDelta.diff} since previous sync
                      </span>
                    </div>
                  )}
                </div>

                {/* Secondary Difficulty Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-success/5 border border-success/20 rounded-xl p-3 text-center space-y-1">
                    <span className="text-[11px] font-semibold text-success uppercase tracking-wider">Easy</span>
                    <div className="text-xl sm:text-2xl font-black text-success">{leetcodeStats?.easy || 0}</div>
                    <span className="text-[10px] text-text-dim">Problems</span>
                  </div>

                  <div className="bg-warning/5 border border-warning/20 rounded-xl p-3 text-center space-y-1">
                    <span className="text-[11px] font-semibold text-warning uppercase tracking-wider">Medium</span>
                    <div className="text-xl sm:text-2xl font-black text-warning">{leetcodeStats?.medium || 0}</div>
                    <span className="text-[10px] text-text-dim">Problems</span>
                  </div>

                  <div className="bg-danger/5 border border-danger/20 rounded-xl p-3 text-center space-y-1">
                    <span className="text-[11px] font-semibold text-danger uppercase tracking-wider">Hard</span>
                    <div className="text-xl sm:text-2xl font-black text-danger">{leetcodeStats?.hard || 0}</div>
                    <span className="text-[10px] text-text-dim">Problems</span>
                  </div>
                </div>

                {/* 5. Contest Rating (Secondary Metric) */}
                {leetcodeStats?.rating && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-bg-elevated/30 border border-border/60 text-xs">
                    <span className="font-semibold text-text-dim flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-warning" />
                      Contest Rating
                    </span>
                    <span className="font-bold text-text-main font-mono text-sm">
                      {Math.round(leetcodeStats.rating)}
                    </span>
                  </div>
                )}
              </div>

              {/* 3. Progress Section: Problems Solved Over Time */}
              <div className="space-y-3 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-text-main flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                    Problems Solved Over Time
                  </span>
                  <span className="text-[11px] text-text-dim">Based on sync history</span>
                </div>

                {/* Loading State */}
                {isLoadingHistory && (
                  <div className="h-36 w-full flex flex-col items-center justify-center bg-bg-elevated/20 border border-border/60 rounded-xl space-y-2">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-xs text-text-dim">Loading progress history...</span>
                  </div>
                )}

                {/* Error State */}
                {!isLoadingHistory && isErrorHistory && (
                  <div className="py-5 px-4 text-center bg-danger/5 border border-danger/20 rounded-xl space-y-2">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-danger">
                      <AlertCircle className="w-4 h-4" />
                      Unable to load progress history.
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetchHistory()}
                      className="h-7 px-3 text-xs font-semibold border-border hover:border-danger/40 cursor-pointer"
                    >
                      Try again
                    </Button>
                  </div>
                )}

                {/* Case 1: Zero Records */}
                {!isLoadingHistory && !isErrorHistory && formattedHistory.length === 0 && (
                  <div className="py-7 px-4 text-center bg-bg-elevated/20 border border-dashed border-border rounded-xl space-y-1.5">
                    <h5 className="text-xs font-bold text-text-main">No progress history yet</h5>
                    <p className="text-[11px] text-text-dim max-w-sm mx-auto leading-relaxed">
                      Your progress will appear here after your first successful profile sync.
                    </p>
                  </div>
                )}

                {/* Case 2: Single Snapshot (1 Record) */}
                {!isLoadingHistory && !isErrorHistory && formattedHistory.length === 1 && (
                  <div className="p-4 bg-bg-elevated/30 border border-border/80 rounded-xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-xs font-bold text-text-main">Initial Snapshot Recorded</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-primary px-2.5 py-0.5 rounded-md bg-primary/10 border border-primary/20 self-start sm:self-auto">
                        {formattedHistory[0].solved} Solved • {formattedHistory[0].fullDate}
                      </span>
                    </div>

                    {(formattedHistory[0].easy > 0 || formattedHistory[0].medium > 0 || formattedHistory[0].hard > 0) && (
                      <div className="flex items-center gap-3 text-xs text-text-muted">
                        <span className="flex items-center gap-1 font-medium">
                          <span className="w-2 h-2 rounded-full bg-success inline-block" /> Easy: <strong className="text-text-main">{formattedHistory[0].easy}</strong>
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <span className="w-2 h-2 rounded-full bg-warning inline-block" /> Medium: <strong className="text-text-main">{formattedHistory[0].medium}</strong>
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <span className="w-2 h-2 rounded-full bg-danger inline-block" /> Hard: <strong className="text-text-main">{formattedHistory[0].hard}</strong>
                        </span>
                      </div>
                    )}

                    <p className="text-[11px] text-text-dim leading-relaxed">
                      Your first progress snapshot is recorded. Sync again after solving more problems to see your progress over time.
                    </p>
                  </div>
                )}

                {/* Case 3: Multiple Records (2+ Snapshots) */}
                {!isLoadingHistory && !isErrorHistory && formattedHistory.length >= 2 && (
                  <div className="h-44 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={formattedHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="solvedGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-primary, #6366f1)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="var(--color-primary, #6366f1)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="date" stroke="#888888" fontSize={10} tickLine={false} />
                        <YAxis stroke="#888888" fontSize={10} tickLine={false} />
                        <Tooltip content={<CustomChartTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="solved"
                          name="Total Solved"
                          stroke="var(--color-primary, #6366f1)"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#solvedGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connect Modal */}
      <ConnectCodingModal
        open={isConnectModalOpen}
        onOpenChange={setIsConnectModalOpen}
        initialAccount={pendingAccountToVerify}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["coding"] });
        }}
      />

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={showDisconnectConfirm} onOpenChange={setShowDisconnectConfirm}>
        <DialogContent className="sm:max-w-md bg-bg-card border-border text-text-main">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-danger/10 border border-danger/20 flex items-center justify-center text-danger">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <DialogTitle className="text-base font-bold text-text-main">
                Disconnect LeetCode Profile?
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-text-dim leading-relaxed">
              Disconnecting will remove your connected LeetCode handle, saved statistics, and historical progress snapshots from Career OS. You can reconnect anytime.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDisconnectConfirm(false)}
              className="text-xs text-text-dim cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => accountToDisconnect && disconnectMutation.mutate(accountToDisconnect)}
              disabled={disconnectMutation.isPending}
              className="bg-danger hover:bg-danger/90 text-white text-xs font-semibold cursor-pointer h-9 px-4"
            >
              {disconnectMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Disconnecting...
                </>
              ) : (
                "Disconnect Profile"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
