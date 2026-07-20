import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api/analyticsApi";
import { placementsApi } from "@/lib/api/placementsApi";
import { Loader2, TrendingUp, CheckCircle2, AlertCircle, PieChart as PieIcon, Activity, Calendar, Trophy, UserCheck } from "lucide-react";
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  Interested: "#71717A",
  Applied: "#6366F1",
  UnderReview: "#F59E0B",
  Accepted: "#22C55E",
  Rejected: "#EF4444",
};

const PLACEMENT_STATUS_COLORS: Record<string, string> = {
  APPLIED: "#6366F1",
  ASSESSMENT_SCHEDULED: "#F59E0B",
  ASSESSMENT_COMPLETED: "#F59E0B",
  INTERVIEW_SCHEDULED: "#4F46E5",
  INTERVIEW_COMPLETED: "#4F46E5",
  OFFER_RECEIVED: "#22C55E",
  REJECTED: "#EF4444",
  WITHDRAWN: "#71717A",
  SAVED: "#71717A",
  SUBMITTED: "#6366F1",
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
  const applicationsAnalyticsQuery = useQuery({
    queryKey: ['analytics', 'applications'],
    queryFn: analyticsApi.getApplicationsAnalytics,
    enabled: analyticType === "events",
    staleTime: 5 * 60 * 1000,
  });

  // Placements Queries
  const placementAnalyticsQuery = useQuery({
    queryKey: ['analytics', 'placements'],
    queryFn: placementsApi.getAnalytics,
    enabled: analyticType === "placements",
    staleTime: 5 * 60 * 1000,
  });

  const placementTrendsQuery = useQuery({
    queryKey: ['analytics', 'placements', 'trends'],
    queryFn: placementsApi.getTrends,
    enabled: analyticType === "placements",
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = analyticType === "events"
    ? applicationsAnalyticsQuery.isLoading
    : (placementAnalyticsQuery.isLoading || placementTrendsQuery.isLoading);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Event Analytics Data Mapping
  const {
    summary = { totalApplications: 0, accepted: 0, rejected: 0, underReview: 0, overallAcceptanceRate: 0 },
    statusDistribution = {},
    conversionRates = {},
  } = applicationsAnalyticsQuery.data || {};

  const acceptanceRateChartData = Object.entries(conversionRates).map(([type, data]: any) => ({
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

  const placementTrends = placementTrendsQuery.data || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header and Toggle Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h3 className="text-sm font-semibold text-text-main">Pipeline Insights</h3>
          <p className="text-xs text-text-dim mt-0.5">Yield ratios and distribution rates of active tracks</p>
        </div>

        {/* Toggle Selector */}
        <div className="flex gap-1 p-1 border border-border rounded-lg bg-bg-card max-w-[240px]">
          <button
            onClick={() => setAnalyticType("events")}
            className={cn(
              "flex-1 py-1 px-3.5 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer",
              analyticType === "events" ? "bg-bg-elevated text-text-main" : "text-text-muted hover:text-text-main"
            )}
          >
            Events
          </button>
          <button
            onClick={() => setAnalyticType("placements")}
            className={cn(
              "flex-1 py-1 px-3.5 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer",
              analyticType === "placements" ? "bg-bg-elevated text-text-main" : "text-text-muted hover:text-text-main"
            )}
          >
            Placements
          </button>
        </div>
      </div>

      {analyticType === "events" ? (
        <>
          {/* Summary Grid (Events) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Applications", value: summary.totalApplications, icon: <TrendingUp className="w-4 h-4 text-text-muted" /> },
              { label: "Successful Acceptances", value: summary.accepted, icon: <CheckCircle2 className="w-4 h-4 text-success" /> },
              { label: "Pending Review", value: summary.underReview, icon: <AlertCircle className="w-4 h-4 text-warning" /> },
              { label: "Acceptance Yield", value: `${summary.overallAcceptanceRate}%`, icon: <PieIcon className="w-4 h-4 text-primary" /> },
            ].map(item => (
              <div key={item.label} className="bg-bg-card border border-border rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold text-text-dim uppercase tracking-wider">{item.label}</span>
                  {item.icon}
                </div>
                <p className="text-xl font-semibold tracking-tight text-text-main">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Acceptance Rate Chart */}
            <div className="bg-bg-card border border-border rounded-xl p-4 flex flex-col">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-dim mb-6">Yield by Event Segment</h4>
              <div className="h-64 w-full mt-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={acceptanceRateChartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272A" />
                    <XAxis dataKey="type" axisLine={false} tickLine={false} tick={{ fill: '#A1A1AA', fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A1A1AA', fontSize: 10 }} unit="%" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111113', border: '1px solid #27272A', borderRadius: '8px' }}
                      itemStyle={{ color: '#FAFAFA', fontSize: '11px', fontWeight: 500 }}
                      cursor={{ fill: '#18181B' }}
                    />
                    <Bar dataKey="rate" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Distribution Chart */}
            <div className="bg-bg-card border border-border rounded-xl p-4 flex flex-col">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-dim mb-6">Pipeline Composition</h4>
              <div className="h-64 w-full mt-auto flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistributionArray}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={90}
                      paddingAngle={6}
                      dataKey="count"
                      stroke="none"
                    >
                      {statusDistributionArray.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || "#6366F1"} />
                      ))}
                    </Pie>
                    <Tooltip 
                       contentStyle={{ backgroundColor: '#111113', border: '1px solid #27272A', borderRadius: '8px' }}
                       itemStyle={{ color: '#FAFAFA', fontSize: '11px', fontWeight: 500 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Summary Grid (Placements) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Submitted Placements", value: pData.submitted, icon: <TrendingUp className="w-4 h-4 text-text-muted" /> },
              { label: "Assessment Yield", value: `${pData.assessmentConversion}%`, icon: <Trophy className="w-4 h-4 text-warning" /> },
              { label: "Interview Yield", value: `${pData.interviewConversion}%`, icon: <Calendar className="w-4 h-4 text-indigo-500" /> },
              { label: "Offer Yield", value: `${pData.offerConversion}%`, icon: <UserCheck className="w-4 h-4 text-success" /> },
            ].map(item => (
              <div key={item.label} className="bg-bg-card border border-border rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold text-text-dim uppercase tracking-wider">{item.label}</span>
                  {item.icon}
                </div>
                <p className="text-xl font-semibold tracking-tight text-text-main">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Distribution Pie Chart */}
            <div className="bg-bg-card border border-border rounded-xl p-4 flex flex-col">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-dim mb-6">Funnel Status Composition</h4>
              <div className="h-64 w-full mt-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={placementStatusDistArray}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={90}
                      paddingAngle={6}
                      dataKey="count"
                      stroke="none"
                    >
                      {placementStatusDistArray.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={PLACEMENT_STATUS_COLORS[entry.status] || "#6366F1"} />
                      ))}
                    </Pie>
                    <Tooltip 
                       contentStyle={{ backgroundColor: '#111113', border: '1px solid #27272A', borderRadius: '8px' }}
                       itemStyle={{ color: '#FAFAFA', fontSize: '11px', fontWeight: 500 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Funnel Progress list */}
            <div className="bg-bg-card border border-border rounded-xl p-5 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-dim mb-1">Funnel Stage Breakdown</h4>
                <p className="text-[11px] text-text-dim">Stage conversions tracked across job proposals.</p>
              </div>

              <div className="space-y-4 pt-4">
                {[
                  { stage: "Applied", count: pData.submitted, percentage: 100, color: "bg-primary" },
                  { stage: "Assessments", count: (pData.assessmentScheduled || 0) + (pData.assessmentCompleted || 0) + (pData.interviewScheduled || 0) + (pData.interviewCompleted || 0) + (pData.offerReceived || 0), percentage: pData.assessmentConversion, color: "bg-warning" },
                  { stage: "Interviews", count: (pData.interviewScheduled || 0) + (pData.interviewCompleted || 0) + (pData.offerReceived || 0), percentage: pData.interviewConversion, color: "bg-indigo-500" },
                  { stage: "Offers", count: pData.offerReceived, percentage: pData.offerConversion, color: "bg-success" },
                ].map((item) => (
                  <div key={item.stage} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-text-main">{item.stage}</span>
                      <span className="text-text-muted">{item.count} ({item.percentage}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-bg-main border border-border rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", item.color)}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Placement Trends Chart */}
            <div className="bg-bg-card border border-border rounded-xl p-4 flex flex-col md:col-span-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-dim mb-6">Placements Trend Over Time</h4>
              <div className="h-64 w-full mt-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={placementTrends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272A" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#A1A1AA', fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A1A1AA', fontSize: 10 }} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111113', border: '1px solid #27272A', borderRadius: '8px' }}
                      itemStyle={{ color: '#FAFAFA', fontSize: '11px', fontWeight: 500 }}
                      cursor={{ fill: '#18181B' }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#6366F1" fillOpacity={1} fill="url(#colorCount)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
