import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { codingApi, Platform } from "@/lib/api/codingApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLocation } from "wouter";
import ConnectCodingModal from "./ConnectCodingModal";
import {
  Code2,
  Award,
  ChevronRight,
  Plus,
  Loader2,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const ALL_PLATFORMS: { key: Platform; name: string; color: string }[] = [
  { key: "LEETCODE", name: "LeetCode", color: "text-amber-500" },
  { key: "CODEFORCES", name: "Codeforces", color: "text-blue-500" },
  { key: "CODECHEF", name: "CodeChef", color: "text-amber-600" },
  { key: "HACKERRANK", name: "HackerRank", color: "text-emerald-500" },
  { key: "GEEKSFORGEEKS", name: "GFG", color: "text-green-500" },
];

export default function CodingProfileCard() {
  const [, setLocation] = useLocation();
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  // Queries
  const { data: statsMap, isLoading: isLoadingStats } = useQuery({
    queryKey: ["coding", "stats"],
    queryFn: codingApi.getCurrentStats,
  });

  const { data: accounts } = useQuery({
    queryKey: ["coding", "accounts"],
    queryFn: codingApi.getAccounts,
  });

  // Calculate Aggregated Total Solved across verified accounts
  const aggregatedData = useMemo(() => {
    if (!statsMap) return { totalSolved: 0, platformStats: [] as { name: string; count: number; verified: boolean }[] };

    let sum = 0;
    const platformStats: { name: string; count: number; verified: boolean }[] = [];

    ALL_PLATFORMS.forEach((p) => {
      const stat = statsMap[p.key.toLowerCase()];
      const isVerified = stat && stat.verificationStatus === "VERIFIED";
      if (isVerified) {
        sum += stat.totalSolved || 0;
      }
      platformStats.push({
        name: p.name,
        count: isVerified ? stat.totalSolved : 0,
        verified: !!isVerified,
      });
    });

    return { totalSolved: sum, platformStats };
  }, [statsMap]);

  const hasConnectedAccounts = (accounts && accounts.length > 0);

  if (isLoadingStats) {
    return (
      <Card className="bg-bg-card border-border/80 rounded-2xl overflow-hidden shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-6 space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-xs text-text-dim">Loading coding profiles...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-bg-card border-border/80 rounded-2xl overflow-hidden shadow-sm hover:border-border transition-all">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-text-main flex items-center gap-2">
                Coding Profile
                <Badge variant="outline" className="text-[10px] font-semibold bg-bg-elevated text-text-dim border-border">
                  Multi-Platform
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs text-text-dim">
                Aggregated problem solving activity
              </CardDescription>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => setLocation("/coding")}
            variant="ghost"
            className="text-xs font-semibold text-primary hover:text-primary-hover hover:bg-primary/10 h-8 px-2.5 cursor-pointer"
          >
            View Profile
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        {!hasConnectedAccounts ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-bg-elevated text-text-dim flex items-center justify-center mx-auto">
              <Code2 className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-semibold text-text-main">No Coding Platform Connected</h4>
            <p className="text-xs text-text-dim max-w-xs mx-auto leading-relaxed">
              Connect LeetCode, Codeforces, CodeChef, HackerRank, or GFG to aggregate your solved problems.
            </p>
            <Button
              size="sm"
              onClick={() => setIsConnectModalOpen(true)}
              className="mt-1 bg-primary hover:bg-primary-hover text-white text-xs font-semibold cursor-pointer h-8"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Connect Platform
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Hero Aggregate Metric */}
            <div className="flex items-baseline justify-between p-3.5 rounded-xl bg-primary/5 border border-primary/15">
              <div className="space-y-0.5">
                <span className="text-[10px] font-semibold text-text-dim uppercase tracking-wider flex items-center gap-1">
                  <Award className="w-3 h-3 text-primary" />
                  Aggregated Total Solved
                </span>
                <div className="text-3xl font-black text-text-main tracking-tight">
                  {aggregatedData.totalSolved.toLocaleString()}
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setLocation("/coding")}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold h-8 px-3 cursor-pointer"
              >
                Full Analytics
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>

            {/* Platform Mini Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
              {aggregatedData.platformStats.map((p) => (
                <div
                  key={p.name}
                  className={cn(
                    "p-2.5 rounded-xl border transition-all",
                    p.verified
                      ? "bg-bg-elevated/40 border-border/80"
                      : "bg-bg-card border-dashed border-border/40 opacity-60"
                  )}
                >
                  <span className="text-[10px] font-semibold text-text-dim block truncate">{p.name}</span>
                  <span className="text-sm font-bold text-text-main block mt-0.5">
                    {p.verified ? p.count : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <ConnectCodingModal
        open={isConnectModalOpen}
        onOpenChange={setIsConnectModalOpen}
        onSuccess={() => {
          setLocation("/coding");
        }}
      />
    </Card>
  );
}
