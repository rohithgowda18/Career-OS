import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api/analyticsApi";
import { Loader2, TrendingUp, CheckCircle2, AlertCircle, PieChart as PieIcon, Activity } from "lucide-react";
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

export default function AnalyticsDashboard() {
  const acceptanceRatesQuery = useQuery({ queryKey: ['analytics', 'rates'], queryFn: analyticsApi.acceptanceRates });
  const statusDistributionQuery = useQuery({ queryKey: ['analytics', 'distribution'], queryFn: analyticsApi.statusDistribution });
  const summaryQuery = useQuery({ queryKey: ['analytics', 'summary'], queryFn: analyticsApi.summary });

  const isLoading = acceptanceRatesQuery.isLoading || statusDistributionQuery.isLoading || summaryQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const acceptanceRates = acceptanceRatesQuery.data || {};
  const statusDistribution = statusDistributionQuery.data || {};
  const summary = summaryQuery.data || { totalApplications: 0, accepted: 0, rejected: 0, underReview: 0, overallAcceptanceRate: 0 };

  const acceptanceRateChartData = Object.entries(acceptanceRates).map(([type, data]: any) => ({
    type, rate: data.rate, total: data.total, accepted: data.accepted,
  }));

  const statusDistributionArray = Object.entries(statusDistribution).map(([status, count]: any) => ({
    status, count,
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center gap-4">
         <div className="w-12 h-12 rounded-[1.25rem] bg-bg-elevated border border-border flex items-center justify-center shadow-lg group hover:border-primary/40 transition-colors">
            <Activity className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
         </div>
         <div>
            <h2 className="text-2xl font-black tracking-tight">Intelligence</h2>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] opacity-60">Success Metrics & Distribution</p>
         </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: "Total Load", value: summary.totalApplications, icon: <TrendingUp className="w-5 h-5" />, color: "text-text-main", bg: "bg-bg-elevated" },
          { label: "Successful", value: summary.accepted, icon: <CheckCircle2 className="w-5 h-5" />, color: "text-success", bg: "bg-success/10" },
          { label: "Pipeline", value: summary.underReview, icon: <AlertCircle className="w-5 h-5" />, color: "text-primary", bg: "bg-primary/10" },
          { label: "Yield %", value: `${summary.overallAcceptanceRate}%`, icon: <PieIcon className="w-5 h-5" />, color: "text-accent", bg: "bg-accent/10" },
        ].map(item => (
          <div key={item.label} className="card-premium p-8 flex flex-col items-center text-center group bg-bg-card/40">
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
        <div className="card-premium p-8 flex flex-col bg-bg-card/20">
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
        <div className="card-premium p-8 flex flex-col bg-bg-card/20">
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
        <div className="p-8 border-b border-border flex items-center justify-between bg-bg-card/40">
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
    </div>
  );
}
