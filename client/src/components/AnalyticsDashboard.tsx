import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const COLORS = {
  Hackathon: "#3b82f6",
  Workshop: "#10b981",
  Conference: "#f59e0b",
  Other: "#8b5cf6",
  Accepted: "#10b981",
  Rejected: "#ef4444",
  Interested: "#6b7280",
  Applied: "#3b82f6",
  "Under Review": "#f59e0b",
  Withdrawn: "#9ca3af",
};

export default function AnalyticsDashboard() {
  const acceptanceRatesQuery = trpc.analytics.acceptanceRates.useQuery();
  const seasonalTrendsQuery = trpc.analytics.seasonalTrends.useQuery();
  const statusDistributionQuery = trpc.analytics.statusDistribution.useQuery();
  const summaryQuery = trpc.analytics.summary.useQuery();

  const isLoading =
    acceptanceRatesQuery.isLoading ||
    seasonalTrendsQuery.isLoading ||
    statusDistributionQuery.isLoading ||
    summaryQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const acceptanceRates = acceptanceRatesQuery.data || {};
  const seasonalTrends = seasonalTrendsQuery.data || [];
  const statusDistribution = statusDistributionQuery.data || [];
  const summary = summaryQuery.data || {
    totalApplications: 0,
    accepted: 0,
    rejected: 0,
    underReview: 0,
    overallAcceptanceRate: 0,
  };

  // Prepare data for acceptance rate chart
  const acceptanceRateChartData = Object.entries(acceptanceRates).map(
    ([type, data]: any) => ({
      type,
      rate: data.rate,
      total: data.total,
      accepted: data.accepted,
    })
  );

  // Prepare data for status distribution pie chart
  const statusColors: Record<string, string> = {
    Interested: "#6b7280",
    Applied: "#3b82f6",
    "Under Review": "#f59e0b",
    Accepted: "#10b981",
    Rejected: "#ef4444",
    Withdrawn: "#9ca3af",
  };

  return (
    <div className="space-y-8">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-elevated p-6">
          <p className="text-sm text-muted-foreground mb-2">Total Applications</p>
          <p className="text-3xl font-bold text-foreground">{summary?.totalApplications || 0}</p>
        </div>
        <div className="card-elevated p-6">
          <p className="text-sm text-muted-foreground mb-2">Accepted</p>
          <p className="text-3xl font-bold text-green-600">{summary?.accepted || 0}</p>
        </div>
        <div className="card-elevated p-6">
          <p className="text-sm text-muted-foreground mb-2">Under Review</p>
          <p className="text-3xl font-bold text-yellow-600">{summary?.underReview || 0}</p>
        </div>
        <div className="card-elevated p-6">
          <p className="text-sm text-muted-foreground mb-2">Overall Acceptance Rate</p>
          <p className="text-3xl font-bold text-blue-600">{summary?.overallAcceptanceRate || 0}%</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Acceptance Rate by Event Type */}
        <div className="card-elevated p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">Acceptance Rate by Event Type</h3>
          <ChartContainer
            config={{
              rate: { label: "Acceptance Rate (%)", color: "hsl(var(--primary))" },
            }}
            className="w-full h-80"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={acceptanceRateChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="type" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                  formatter={(value: any) => `${value}%`}
                />
                <Bar dataKey="rate" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Status Distribution */}
        <div className="card-elevated p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">Status Distribution</h3>
          <ChartContainer
            config={{
              count: { label: "Applications", color: "hsl(var(--primary))" },
            }}
            className="w-full h-80"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }) => `${status}: ${count}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {statusDistribution.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={statusColors[entry.status] || "#8884d8"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>

      {/* Seasonal Trends */}
      <div className="card-elevated p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Seasonal Trends</h3>
        {seasonalTrends.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">No seasonal data available</p>
          </div>
        ) : (
          <ChartContainer
            config={{
              applications: { label: "Applications", color: "hsl(var(--primary))" },
              accepted: { label: "Accepted", color: "hsl(var(--success))" },
            }}
            className="w-full h-96"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={seasonalTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="applications"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="accepted"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </div>

      {/* Detailed Breakdown */}
      <div className="card-elevated p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Acceptance Rate Breakdown</h3>
        <div className="space-y-4">
          {acceptanceRateChartData.map((item: any) => (
            <div key={item.type} className="flex items-center justify-between p-4 rounded-lg bg-background/50">
              <div>
                <p className="font-medium text-foreground">{item.type}</p>
                <p className="text-sm text-muted-foreground">
                  {item.accepted} of {item.total} applications accepted
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">{item.rate}%</p>
                <div className="w-32 h-2 rounded-full bg-background border border-border mt-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
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
