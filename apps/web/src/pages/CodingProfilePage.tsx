import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { codingApi, CodingStatsResponse, ConnectAccountResponse, Platform, DailyChallengeDTO } from "@/lib/api/codingApi";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ConnectCodingModal from "@/components/ConnectCodingModal";
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
  Flame,
  Globe,
  Sparkles,
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

const ALL_PLATFORMS: { key: Platform; name: string; url: string; color: string }[] = [
  { key: "LEETCODE", name: "LeetCode", url: "https://leetcode.com/u/", color: "text-amber-500" },
  { key: "CODEFORCES", name: "Codeforces", url: "https://codeforces.com/profile/", color: "text-blue-500" },
  { key: "CODECHEF", name: "CodeChef", url: "https://www.codechef.com/users/", color: "text-amber-600" },
  { key: "HACKERRANK", name: "HackerRank", url: "https://www.hackerrank.com/profile/", color: "text-emerald-500" },
  { key: "GEEKSFORGEEKS", name: "GeeksforGeeks", url: "https://auth.geeksforgeeks.org/user/", color: "text-green-500" },
];

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

export default function CodingProfilePage() {
  const queryClient = useQueryClient();
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [selectedPlatformToConnect, setSelectedPlatformToConnect] = useState<Platform>("LEETCODE");
  const [pendingAccountToVerify, setPendingAccountToVerify] = useState<ConnectAccountResponse | null>(null);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [accountToDisconnect, setAccountToDisconnect] = useState<{ id: number; name: string } | null>(null);

  // Queries
  const { data: statsMap, isLoading: isLoadingStats, isError: isErrorStats, refetch: refetchStats } = useQuery({
    queryKey: ["coding", "stats"],
    queryFn: codingApi.getCurrentStats,
  });

  const { data: historyData, isLoading: isLoadingHistory, isError: isErrorHistory, refetch: refetchHistory } = useQuery({
    queryKey: ["coding", "history"],
    queryFn: codingApi.getStatsHistory,
  });

  const { data: accounts } = useQuery({
    queryKey: ["coding", "accounts"],
    queryFn: codingApi.getAccounts,
  });

  const { data: dailyChallenges, isLoading: isLoadingDaily } = useQuery({
    queryKey: ["coding", "daily"],
    queryFn: codingApi.getDailyChallenges,
  });

  // Mutations
  const syncMutation = useMutation({
    mutationFn: (accountId: number) => codingApi.syncStats(accountId),
    onSuccess: (data) => {
      toast.success(`Synchronized ${data.totalSolved} solved problems from ${data.platform}!`);
      queryClient.invalidateQueries({ queryKey: ["coding"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to sync platform stats");
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (accountId: number) => codingApi.disconnectAccount(accountId),
    onSuccess: () => {
      toast.success("Platform account disconnected");
      setShowDisconnectConfirm(false);
      setAccountToDisconnect(null);
      queryClient.invalidateQueries({ queryKey: ["coding"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to disconnect account");
    },
  });

  // Aggregated total solved (sum across verified accounts)
  const aggregatedStats = useMemo(() => {
    if (!statsMap) return { totalSolved: 0, breakdown: [] as { name: string; count: number; color: string }[] };

    let sum = 0;
    const breakdown: { name: string; count: number; color: string }[] = [];

    ALL_PLATFORMS.forEach((p) => {
      const stat = statsMap[p.key.toLowerCase()];
      if (stat && stat.verificationStatus === "VERIFIED") {
        sum += stat.totalSolved || 0;
        breakdown.push({
          name: p.name,
          count: stat.totalSolved || 0,
          color: p.color,
        });
      }
    });

    return { totalSolved: sum, breakdown };
  }, [statsMap]);

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

  const handleOpenConnect = (plat: Platform = "LEETCODE") => {
    setSelectedPlatformToConnect(plat);
    setPendingAccountToVerify(null);
    setIsConnectModalOpen(true);
  };

  const confirmDisconnect = (id: number, name: string) => {
    setAccountToDisconnect({ id, name });
    setShowDisconnectConfirm(true);
  };

  return (
    <DashboardLayout activeTab="skills" activeTabName="Coding Profile">
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bg-card border border-border/80 rounded-2xl p-6 shadow-sm">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-text-main tracking-tight">
                  Multi-Platform Coding Profile
                </h1>
                <p className="text-xs text-text-dim">
                  Unified progress tracking across LeetCode, Codeforces, CodeChef, HackerRank, and GeeksforGeeks
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => handleOpenConnect("LEETCODE")}
            className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold h-9 px-4 cursor-pointer self-start sm:self-auto shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Connect Platform
          </Button>
        </div>

        {/* Hero Aggregated Metrics Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-primary/5 border border-primary/20 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-text-dim uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-primary" />
                Aggregated Total Solved
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl sm:text-5xl font-black text-text-main tracking-tight">
                  {aggregatedStats.totalSolved.toLocaleString()}
                </span>
                <span className="text-xs text-text-dim font-medium">total problems solved</span>
              </div>
            </div>

            {/* Platform Breakdown Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
              {aggregatedStats.breakdown.length > 0 ? (
                aggregatedStats.breakdown.map((b) => (
                  <div key={b.name} className="px-3 py-1.5 rounded-lg bg-bg-card border border-border text-xs font-semibold flex items-center gap-2">
                    <span className="text-text-muted">{b.name}:</span>
                    <span className="font-bold text-text-main">{b.count}</span>
                  </div>
                ))
              ) : (
                <span className="text-xs text-text-dim">No platforms connected yet. Connect your first platform to start aggregating stats.</span>
              )}
            </div>
          </div>

          {/* Quick Stats Card */}
          <div className="bg-bg-card border border-border/80 rounded-2xl p-5 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-xs font-semibold text-text-dim uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-primary" />
                Connected Platforms
              </span>
              <div className="text-3xl font-black text-text-main mt-1">
                {aggregatedStats.breakdown.length} / 5
              </div>
            </div>
            <p className="text-[11px] text-text-dim leading-relaxed">
              Statistics are aggregated solely from verified profiles with manual on-demand synchronization.
            </p>
          </div>
        </div>

        {/* 6. Platform Grid Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-main flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              Supported Platforms
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ALL_PLATFORMS.map((plat) => {
              const stat = statsMap ? statsMap[plat.key.toLowerCase()] : null;
              const account = (accounts || []).find((a) => a.platform === plat.key);
              const isVerified = stat?.verificationStatus === "VERIFIED";

              if (isVerified && stat) {
                return (
                  <Card key={plat.key} className="bg-bg-card border-border/80 rounded-2xl overflow-hidden shadow-xs hover:border-border transition-all">
                    <CardHeader className="p-4 pb-3 border-b border-border/40">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-text-main">{plat.name}</span>
                          <a
                            href={`${plat.url}${stat.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary font-mono hover:underline flex items-center gap-0.5"
                          >
                            @{stat.username}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/30 flex items-center gap-1 py-0 px-2">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 space-y-4">
                      {/* Metric breakdown */}
                      <div className="flex items-baseline justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-semibold text-text-dim uppercase tracking-wider">Solved</span>
                          <div className="text-2xl font-black text-text-main">{stat.totalSolved}</div>
                        </div>
                        {stat.rating && (
                          <div className="text-right space-y-0.5">
                            <span className="text-[10px] font-semibold text-text-dim uppercase tracking-wider">Rating / Score</span>
                            <div className="text-lg font-bold text-warning font-mono">{Math.round(stat.rating)}</div>
                          </div>
                        )}
                      </div>

                      {(stat.easy > 0 || stat.medium > 0 || stat.hard > 0) && (
                        <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                          <div className="p-1.5 rounded-lg bg-success/5 border border-success/20">
                            <span className="text-[10px] text-success block">Easy</span>
                            <span className="font-bold text-success">{stat.easy}</span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-warning/5 border border-warning/20">
                            <span className="text-[10px] text-warning block">Med</span>
                            <span className="font-bold text-warning">{stat.medium}</span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-danger/5 border border-danger/20">
                            <span className="text-[10px] text-danger block">Hard</span>
                            <span className="font-bold text-danger">{stat.hard}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                        <span className="text-[11px] text-text-dim flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatSyncTime(stat.syncedAt)}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => syncMutation.mutate(stat.accountId)}
                            disabled={syncMutation.isPending}
                            className="h-7 px-2.5 text-xs font-semibold cursor-pointer border-border hover:border-primary/40"
                          >
                            <RefreshCw className="w-3 h-3 mr-1 text-primary" />
                            Sync
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => confirmDisconnect(stat.accountId, plat.name)}
                            className="h-7 w-7 p-0 text-text-dim hover:text-danger hover:bg-danger/10 cursor-pointer"
                          >
                            <Unlink className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              }

              if (account && !isVerified) {
                return (
                  <Card key={plat.key} className="bg-bg-card border-warning/30 rounded-2xl overflow-hidden p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-text-main">{plat.name}</span>
                      <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/30">
                        Pending Verification
                      </Badge>
                    </div>
                    <p className="text-xs text-text-dim">
                      Verification code generated for <strong className="text-text-main">@{account.username}</strong>.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => {
                          setPendingAccountToVerify(account);
                          setSelectedPlatformToConnect(plat.key);
                          setIsConnectModalOpen(true);
                        }}
                        className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold h-8 cursor-pointer"
                      >
                        Verify Ownership
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => confirmDisconnect(account.accountId, plat.name)}
                        className="text-xs text-danger hover:bg-danger/10 h-8 cursor-pointer"
                      >
                        Cancel
                      </Button>
                    </div>
                  </Card>
                );
              }

              return (
                <div
                  key={plat.key}
                  className="bg-bg-card/60 border border-dashed border-border/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-text-main">{plat.name}</span>
                      <Badge variant="outline" className="text-[10px] bg-bg-elevated text-text-dim border-border">
                        Not Connected
                      </Badge>
                    </div>
                    <p className="text-xs text-text-dim">
                      Link your {plat.name} account to sync solved problems and ratings.
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenConnect(plat.key)}
                    className="w-full text-xs font-semibold h-8 border-border hover:border-primary/50 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Connect {plat.name}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 8. Daily Coding Challenges Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-main flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-warning" />
              Today's Coding Challenges
            </h2>
            <span className="text-xs text-text-dim">Aggregated live challenges & practice links</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(dailyChallenges || []).map((ch: DailyChallengeDTO) => (
              <a
                key={ch.platform}
                href={ch.problemUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-bg-card border border-border/80 hover:border-primary/50 rounded-xl p-4 flex flex-col justify-between space-y-3 transition-all hover:shadow-xs group cursor-pointer"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] font-semibold bg-bg-elevated text-text-main border-border">
                      {ch.platformName}
                    </Badge>
                    {ch.difficulty && (
                      <span className="text-[10px] font-semibold text-text-dim px-2 py-0.5 rounded bg-bg-elevated/60">
                        {ch.difficulty}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-text-main group-hover:text-primary transition-colors flex items-center justify-between">
                    <span className="truncate">{ch.title}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary shrink-0 ml-1" />
                  </h3>
                </div>

                <span className="text-[11px] text-primary font-medium flex items-center gap-1">
                  Open Challenge <ExternalLink className="w-3 h-3" />
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* 10. Historical Analytics Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-text-main flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-primary" />
              Problems Solved Over Time
            </span>
            <span className="text-[11px] text-text-dim">Based on recorded sync history</span>
          </div>

          {isLoadingHistory && (
            <div className="h-44 w-full flex flex-col items-center justify-center bg-bg-elevated/20 border border-border/60 rounded-xl space-y-2">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-xs text-text-dim">Loading progress history...</span>
            </div>
          )}

          {!isLoadingHistory && formattedHistory.length === 0 && (
            <div className="py-8 px-4 text-center bg-bg-elevated/20 border border-dashed border-border rounded-xl space-y-1.5">
              <h5 className="text-xs font-bold text-text-main">No progress history yet</h5>
              <p className="text-[11px] text-text-dim max-w-sm mx-auto leading-relaxed">
                Your progress will appear here after your first successful profile sync.
              </p>
            </div>
          )}

          {!isLoadingHistory && formattedHistory.length === 1 && (
            <div className="p-4 bg-bg-elevated/30 border border-border/80 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-bold text-text-main">Initial Snapshot Recorded</span>
                </div>
                <span className="text-xs font-mono font-bold text-primary px-2.5 py-0.5 rounded-md bg-primary/10 border border-primary/20">
                  {formattedHistory[0].solved} Solved • {formattedHistory[0].fullDate}
                </span>
              </div>
              <p className="text-[11px] text-text-dim leading-relaxed">
                Your first progress snapshot is recorded. Sync again after solving more problems to see your progress over time.
              </p>
            </div>
          )}

          {!isLoadingHistory && formattedHistory.length >= 2 && (
            <div className="h-52 w-full pt-2 bg-bg-card border border-border/80 rounded-2xl p-4">
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
          )}
        </div>
      </div>

      {/* Connect Modal */}
      <ConnectCodingModal
        open={isConnectModalOpen}
        onOpenChange={setIsConnectModalOpen}
        defaultPlatform={selectedPlatformToConnect}
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
                Disconnect {accountToDisconnect?.name} Profile?
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-text-dim leading-relaxed">
              Disconnecting will remove your connected {accountToDisconnect?.name} handle, saved statistics, and historical progress snapshots. You can reconnect anytime.
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
              onClick={() => accountToDisconnect && disconnectMutation.mutate(accountToDisconnect.id)}
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
    </DashboardLayout>
  );
}
