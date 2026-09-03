import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { codingApi, CodingStatsResponse, CodingStatsHistoryDTO, ConnectAccountResponse } from "@/lib/api/codingApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Award
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

export default function CodingProfileCard() {
  const queryClient = useQueryClient();
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [pendingAccountToVerify, setPendingAccountToVerify] = useState<ConnectAccountResponse | null>(null);

  // Queries
  const { data: statsMap, isLoading: isLoadingStats } = useQuery({
    queryKey: ["coding", "stats"],
    queryFn: codingApi.getCurrentStats,
  });

  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
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
      queryClient.invalidateQueries({ queryKey: ["coding"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to disconnect account");
    },
  });

  const handleDisconnect = (accountId: number) => {
    if (window.confirm("Are you sure you want to disconnect your LeetCode profile? Your stats history will be removed.")) {
      disconnectMutation.mutate(accountId);
    }
  };

  const formattedHistory = (historyData || []).map((item) => ({
    date: new Date(item.recordedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    solved: item.totalSolved,
    easy: item.easy,
    medium: item.medium,
    hard: item.hard,
  }));

  if (isLoadingStats) {
    return (
      <Card className="bg-bg-card border-border/80">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-bg-card border-border/80 rounded-2xl overflow-hidden shadow-sm">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-warning/10 border border-warning/20 flex items-center justify-center text-warning">
                <Code2 className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-text-main flex items-center gap-2">
                  Coding Profiles
                  <Badge variant="outline" className="text-[10px] font-semibold bg-bg-elevated text-text-dim border-border">
                    Phase 1: LeetCode
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-text-dim">
                  Live problem solving metrics, difficulty distribution, and activity
                </CardDescription>
              </div>
            </div>

            {!leetcodeStats && (
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
          </div>
        </CardHeader>

        <CardContent className="p-5">
          {!leetcodeStats && !leetcodeAccount ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-bg-elevated text-text-dim flex items-center justify-center mx-auto">
                <Code2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-text-main">No Coding Account Connected</h4>
              <p className="text-xs text-text-dim max-w-sm mx-auto">
                Connect your public LeetCode profile to automatically showcase solved problems, difficulty breakdowns, and contest ratings.
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setPendingAccountToVerify(null);
                  setIsConnectModalOpen(true);
                }}
                className="mt-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold"
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
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold h-8"
                >
                  Verify Ownership
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDisconnect(leetcodeAccount.accountId)}
                  className="text-xs text-danger hover:bg-danger/10 h-8"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            /* Verified LeetCode Profile Display */
            <div className="space-y-6">
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
                      Last synced: {new Date(leetcodeStats.syncedAt).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => leetcodeStats?.accountId && syncMutation.mutate(leetcodeStats.accountId)}
                    disabled={syncMutation.isPending}
                    className="h-8 px-3 text-xs font-semibold border-border hover:border-primary/40 cursor-pointer"
                  >
                    {syncMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1 text-primary" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5 mr-1 text-primary" />
                    )}
                    Sync Now
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => leetcodeStats?.accountId && handleDisconnect(leetcodeStats.accountId)}
                    disabled={disconnectMutation.isPending}
                    className="h-8 px-2.5 text-xs text-text-dim hover:text-danger hover:bg-danger/10 cursor-pointer"
                    title="Disconnect Account"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Solved Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-bg-elevated/30 border border-border/80 rounded-xl p-3.5 text-center space-y-1">
                  <span className="text-[11px] font-semibold text-text-dim uppercase tracking-wider">Total Solved</span>
                  <div className="text-2xl font-black text-text-main">{leetcodeStats?.totalSolved || 0}</div>
                  <span className="text-[10px] text-text-dim">Problems</span>
                </div>

                <div className="bg-success/5 border border-success/20 rounded-xl p-3.5 text-center space-y-1">
                  <span className="text-[11px] font-semibold text-success uppercase tracking-wider">Easy</span>
                  <div className="text-2xl font-black text-success">{leetcodeStats?.easy || 0}</div>
                  <span className="text-[10px] text-text-dim">Solved</span>
                </div>

                <div className="bg-warning/5 border border-warning/20 rounded-xl p-3.5 text-center space-y-1">
                  <span className="text-[11px] font-semibold text-warning uppercase tracking-wider">Medium</span>
                  <div className="text-2xl font-black text-warning">{leetcodeStats?.medium || 0}</div>
                  <span className="text-[10px] text-text-dim">Solved</span>
                </div>

                <div className="bg-danger/5 border border-danger/20 rounded-xl p-3.5 text-center space-y-1">
                  <span className="text-[11px] font-semibold text-danger uppercase tracking-wider">Hard</span>
                  <div className="text-2xl font-black text-danger">{leetcodeStats?.hard || 0}</div>
                  <span className="text-[10px] text-text-dim">Solved</span>
                </div>
              </div>

              {/* Rating if present */}
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

              {/* Historical Analytics Chart */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-text-main flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                    Problems Solved Over Time
                  </span>
                  <span className="text-[11px] text-text-dim">Based on sync history</span>
                </div>

                {formattedHistory.length >= 2 ? (
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
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--color-bg-card, #1e1e2d)",
                            borderColor: "var(--color-border, #333)",
                            borderRadius: "8px",
                            fontSize: "11px",
                          }}
                        />
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
                ) : (
                  <div className="py-6 text-center text-xs text-text-dim bg-bg-elevated/20 border border-dashed border-border rounded-xl">
                    History will appear after your account is synchronized over time.
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ConnectCodingModal
        open={isConnectModalOpen}
        onOpenChange={setIsConnectModalOpen}
        initialAccount={pendingAccountToVerify}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["coding"] });
        }}
      />
    </div>
  );
}
