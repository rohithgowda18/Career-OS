import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api/analyticsApi";
import { placementsApi } from "@/lib/api/placementsApi";
import { Loader2, TrendingUp, CheckCircle2, AlertCircle, PieChart as PieIcon, Activity, Calendar, Trophy, UserCheck } from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  Interested: "#A1A1AA",
  Applied: "#F97316",
  UnderReview: "#EC4899",
  Accepted: "#22C55E",
  Rejected: "#EF4444",
};

const PLACEMENT_STATUS_COLORS: Record<string, string> = {
  APPLIED: "#F97316",
  ASSESSMENT_SCHEDULED: "#F59E0B",
  ASSESSMENT_COMPLETED: "#10B981",
  INTERVIEW_SCHEDULED: "#6366F1",
  INTERVIEW_COMPLETED: "#3B82F6",
  OFFER_RECEIVED: "#10B981",
  REJECTED: "#EF4444",
  WITHDRAWN: "#A1A1AA",
};

const PLACEMENT_STATUS_LABELS: Record<string, string> = {
  APPLIED: "Applied",
  ASSESSMENT_SCHEDULED: "Assessment Scheduled",
  ASSESSMENT_COMPLETED: "Assessment Completed",
  INTERVIEW_SCHEDULED: "Interview Scheduled",
  INTERVIEW_COMPLETED: "Interview Completed",
  OFFER_RECEIVED: "Offer Received",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

export default function AnalyticsDashboard() {
  const [analyticType, setAnalyticType] = useState<"events" | "placements">("events");

  // Events Queries
  const acceptanceRatesQuery = useQuery({ queryKey: ['analytics', 'rates'], queryFn: analyticsApi.acceptanceRates, enabled: analyticType === "events" });
  const statusDistributionQuery = useQuery({ queryKey: ['analytics', 'distribution'], queryFn: analyticsApi.statusDistribution, enabled: analyticType === "events" });
  const summaryQuery = useQuery({ queryKey: ['analytics', 'summary'], queryFn: analyticsApi.summary, enabled: analyticType === "events" });

  // Placements Queries
  const placementAnalyticsQuery = useQuery({
    queryKey: ['analytics', 'placements'],
    queryFn: placementsApi.getAnalytics,
    enabled: analyticType === "placements",
  });

  const isLoading = analyticType === "events"
    ? (acceptanceRatesQuery.isLoading || statusDistributionQuery.isLoading || summaryQuery.isLoading)
    : placementAnalyticsQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  // Event Analytics Data Mapping
  const acceptanceRates = acceptanceRatesQuery.data || {};
  const statusDistribution = statusDistributionQuery.data || {};
  const summary = summaryQuery.data || { totalApplications: 0, accepted: 0, rejected: 0, underReview: 0, overallAcceptanceRate: 0 };

  const acceptanceRateChartData = Object.entries(acceptanceRates).map(([type, data]: any) => ({
    type, rate: data.rate, total: data.total, accepted: data.accepted,
  }));

  const statusDistributionArray = Object.entries(statusDistribution).map(([status, count]: any) => ({
    status, count,
  }));

  // Placement Analytics Data Mapping
  const pData = placementAnalyticsQuery.data || {
    totalPlacements: 0,
    saved: 0,
    applied: 0,
    assessmentScheduled: 0,
    assessmentCompleted: 0,
    interviewScheduled: 0,
    interviewCompleted: 0,
    offerReceived: 0,
    rejected: 0,
    withdrawn: 0,
    submitted: 0,
    assessmentConversion: 0,
    interviewConversion: 0,
    offerConversion: 0,
    statusDistribution: {},
  };

  const placementStatusDistArray = Object.entries(pData.statusDistribution || {}).map(([status, count]: any) => ({
    status, count,
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header and Toggle Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-[1.25rem] bg-bg-elevated border border-border flex items-center justify-center shadow-lg group hover:border-primary/40 transition-colors">
              <Activity className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
           </div>
           <div>
              <h2 className="text-2xl font-black tracking-tight">Intelligence</h2>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] opacity-60">Success Metrics & Pipeline Funnel</p>
           </div>
        </div>

        {/* Toggle Button */}
        <div className="flex gap-1.5 p-1 border border-border rounded-xl bg-bg-card/40 max-w-[280px]">
          <button
            onClick={() => setAnalyticType("events")}
            className={cn(
              "flex-1 py-1.5 px-4 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
              analyticType === "events" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-text-muted hover:text-text-main"
            )}
          >
            Events
          </button>
          <button
            onClick={() => setAnalyticType("placements")}
            className={cn(
              "flex-1 py-1.5 px-4 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
              analyticType === "placements" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-text-muted hover:text-text-main"
            )}
          >
            Placements
          </button>
        </div>
      </div>

      {analyticType === "events" ? (
        <>
          {/* Summary Grid (Events) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Total Load", value: summary.totalApplications, icon: <TrendingUp className="w-5 h-5" />, color: "text-text-main", bg: "bg-bg-elevated" },
              { label: "Successful", value: summary.accepted, icon: <CheckCircle2 className="w-5 h-5" />, color: "text-success", bg: "bg-success/10" },
              { label: "Pipeline", value: summary.underReview, icon: <AlertCircle className="w-5 h-5" />, color: "text-primary", bg: "bg-primary/10" },
              { label: "Yield %", value: `${summary.overallAcceptanceRate}%`, icon: <PieIcon className="w-5 h-5" />, color: "text-accent", bg: "bg-accent/10" },
            ].map(item => (
              <div key={item.label} className="card-premium p-4 sm:p-8 flex flex-col items-center text-center group bg-bg-card/40">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110 shadow-inner border border-white/5", item.bg, item.color)}>
                  {item.icon}
                </div>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">{item.label}</p>
                <p className={cn("text-3xl font-black tabular-nums tracking-tighter", item.color)}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
            {/* Acceptance Rate Chart */}
            <div className="card-premium p-4 sm:p-8 flex flex-col bg-bg-card/20">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted mb-10">Rate by Event Segment</h3>
              <div className="h-80 w-full mt-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={acceptanceRateChartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2A2A30" />
                    <XAxis dataKey="type" axisLine={false} tickLine={false} tick={{ fill: '#A1A1AA', fontSize: 10, fontWeight: 900 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A1A1AA', fontSize: 10, fontWeight: 900 }} unit="%" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#17171A', border: '1px solid #2A2A30', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                      itemStyle={{ color: '#F4F4F5', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px' }}
                      cursor={{ fill: '#1F1F23' }}
                    />
                    <Bar dataKey="rate" fill="#F97316" radius={[8, 8, 0, 0]} barSize={44} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Distribution Chart */}
            <div className="card-premium p-4 sm:p-8 flex flex-col bg-bg-card/20">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted mb-10">Pipeline Composition</h3>
              <div className="h-80 w-full mt-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistributionArray}
                      cx="50%" cy="50%"
                      innerRadius={80} outerRadius={120}
                      paddingAngle={12}
                      dataKey="count"
                      stroke="none"
                    >
                      {statusDistributionArray.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || "#F97316"} />
                      ))}
                    </Pie>
                    <Tooltip 
                       contentStyle={{ backgroundColor: '#17171A', border: '1px solid #2A2A30', borderRadius: '16px' }}
                       itemStyle={{ color: '#F4F4F5', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="card-premium overflow-hidden bg-bg-card/20">
            <div className="p-4 sm:p-8 border-b border-border flex items-center justify-between bg-bg-card/40">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted">Segment Deep Dive</h3>
              <div className="px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-[9px] font-black text-primary uppercase tracking-widest">
                Real-time Calculation
              </div>
            </div>
            <div className="divide-y divide-border">
              {acceptanceRateChartData.map((item: any) => (
                <div key={item.type} className="p-7 flex items-center justify-between hover:bg-bg-elevated/20 transition-all group">
                  <div className="min-w-0 flex-1 mr-6">
                    <p className="font-black text-text-main group-hover:text-primary transition-colors uppercase tracking-tight text-base">{item.type}</p>
                    <p className="text-[10px] font-black text-text-muted mt-2 opacity-50 uppercase tracking-widest">
                       {item.accepted} CONVERSIONS / {item.total} TOTAL OPPORTUNITIES
                    </p>
                  </div>
                  <div className="flex items-center gap-10">
                    <div className="text-right">
                       <p className="text-3xl font-black text-text-main tabular-nums tracking-tighter">{item.rate}%</p>
                       <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] opacity-40 mt-1">YIELD</p>
                    </div>
                    <div className="w-32 h-2.5 rounded-full bg-bg-main border border-border overflow-hidden hidden sm:block shadow-inner">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-accent shadow-[0_0_15px_rgba(249,115,22,0.6)] transition-all duration-1000" 
                        style={{ width: `${item.rate}%` }} 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Summary Grid (Placements) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Submitted", value: pData.submitted, icon: <TrendingUp className="w-5 h-5" />, color: "text-text-main", bg: "bg-bg-elevated" },
              { label: "Assessment Conv.", value: `${pData.assessmentConversion}%`, icon: <Trophy className="w-5 h-5" />, color: "text-amber-500", bg: "bg-amber-500/10" },
              { label: "Interview Conv.", value: `${pData.interviewConversion}%`, icon: <Calendar className="w-5 h-5" />, color: "text-indigo-500", bg: "bg-indigo-500/10" },
              { label: "Offer Conversion", value: `${pData.offerConversion}%`, icon: <UserCheck className="w-5 h-5" />, color: "text-success", bg: "bg-success/10" },
            ].map(item => (
              <div key={item.label} className="card-premium p-4 sm:p-8 flex flex-col items-center text-center group bg-bg-card/40">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110 shadow-inner border border-white/5", item.bg, item.color)}>
                  {item.icon}
                </div>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">{item.label}</p>
                <p className={cn("text-3xl font-black tabular-nums tracking-tighter", item.color)}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
            {/* Status Distribution Pie Chart */}
            <div className="card-premium p-4 sm:p-8 flex flex-col bg-bg-card/20 lg:col-span-1">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted mb-10">Funnel Status Composition</h3>
              <div className="h-80 w-full mt-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={placementStatusDistArray}
                      cx="50%" cy="50%"
                      innerRadius={80} outerRadius={120}
                      paddingAngle={8}
                      dataKey="count"
                      stroke="none"
                    >
                      {placementStatusDistArray.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={PLACEMENT_STATUS_COLORS[entry.status] || "#F97316"} />
                      ))}
                    </Pie>
                    <Tooltip 
                       contentStyle={{ backgroundColor: '#17171A', border: '1px solid #2A2A30', borderRadius: '16px' }}
                       itemStyle={{ color: '#F4F4F5', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Funnel Progress list */}
            <div className="card-premium p-4 sm:p-8 flex flex-col bg-bg-card/20 lg:col-span-2 justify-between">
              <div className="mb-6">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted mb-2"> funnel stage breakdown</h3>
                <p className="text-xs text-text-muted/60">Stage conversion rate tracking across placement applications.</p>
              </div>

              <div className="space-y-6">
                {[
                  {
                    stage: "Applied",
                    sub: "Applications created and submitted",
                    count: pData.submitted,
                    percentage: 100,
                    color: "bg-primary shadow-[0_0_10px_rgba(249,115,22,0.4)]",
                  },
                  {
                    stage: "Assessments",
                    sub: "Assessments scheduled and completed",
                    count: (pData.assessmentScheduled || 0) + (pData.assessmentCompleted || 0) + (pData.interviewScheduled || 0) + (pData.interviewCompleted || 0) + (pData.offerReceived || 0),
                    percentage: pData.assessmentConversion,
                    color: "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]",
                  },
                  {
                    stage: "Interviews",
                    sub: "Mock or final interviews scheduled",
                    count: (pData.interviewScheduled || 0) + (pData.interviewCompleted || 0) + (pData.offerReceived || 0),
                    percentage: pData.interviewConversion,
                    color: "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]",
                  },
                  {
                    stage: "Offers",
                    sub: "Offer letter received",
                    count: pData.offerReceived,
                    percentage: pData.offerConversion,
                    color: "bg-success shadow-[0_0_10px_rgba(16,185,129,0.4)]",
                  },
                ].map((item) => (
                  <div key={item.stage} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-xs font-black text-text-main group-hover:text-primary transition-colors tracking-tight">
                          {item.stage}
                        </span>
                        <span className="text-[9px] text-text-muted block opacity-50 uppercase tracking-widest mt-0.5">
                          {item.sub}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-text-main tabular-nums">
                          {item.count}
                        </span>
                        <span className="text-[9px] text-text-muted/65 block font-bold mt-0.5">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-bg-elevated border border-border overflow-hidden">
                      <div
                        className={cn("h-full transition-all duration-1000", item.color)}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Status Segment Deep Dive */}
          <div className="card-premium overflow-hidden bg-bg-card/20">
            <div className="p-4 sm:p-8 border-b border-border flex items-center justify-between bg-bg-card/40">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted">Pipeline Distribution Breakdown</h3>
              <div className="px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-[9px] font-black text-primary uppercase tracking-widest">
                Real-time Statistics
              </div>
            </div>
            <div className="divide-y divide-border">
              {placementStatusDistArray.map((item: any) => (
                <div key={item.status} className="p-7 flex items-center justify-between hover:bg-bg-elevated/20 transition-all group">
                  <div className="min-w-0 flex-1 mr-6">
                    <p className="font-black text-text-main group-hover:text-primary transition-colors uppercase tracking-tight text-base">
                      {PLACEMENT_STATUS_LABELS[item.status] || item.status}
                    </p>
                    <p className="text-[10px] font-black text-text-muted mt-2 opacity-50 uppercase tracking-widest">
                       {item.count} OPPORTUNITIES IN STAGE
                    </p>
                  </div>
                  <div className="text-right">
                     <p className="text-3xl font-black text-text-main tabular-nums tracking-tighter">{item.count}</p>
                     <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] opacity-40 mt-1">TOTAL COUNT</p>
                  </div>
                </div>
              ))}

              {placementStatusDistArray.length === 0 && (
                <div className="p-12 text-center text-xs font-bold text-text-muted uppercase tracking-widest opacity-40">
                  No data to show
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
