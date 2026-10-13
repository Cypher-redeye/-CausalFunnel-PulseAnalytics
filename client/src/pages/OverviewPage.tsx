import {
  BarChart3,
  Users,
  Eye,
  MousePointerClick,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useAsync } from '../hooks/useAsync';
import { fetchOverview } from '../services/api';
import { LoadingState, ErrorState, EmptyState, StatCard } from '../components/ui';
import { formatNumber, formatShortDate, formatDate, truncateSessionId } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';

const PIE_COLORS = ['#0f172a', '#d97706'];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

function CustomChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-lg">
        <p className="text-xs font-semibold text-stone-500 mb-2">
          {label}
        </p>
        <div className="space-y-1.5">
          {payload.map((entry, index) => (
            <div key={`tooltip-${index}`} className="flex items-center justify-between gap-6 text-xs">
              <span className="flex items-center gap-2 text-stone-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-bold text-stone-900">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

export default function OverviewPage() {
  const { data, loading, error, refetch } = useAsync(fetchOverview, []);
  const navigate = useNavigate();

  if (loading) return <LoadingState message="Loading analytics..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data || (data.stats.total_sessions === 0 && data.stats.total_events === 0)) {
    return (
      <div className="space-y-6">
        <EmptyState
          title="No sessions recorded yet"
          description="Visit the interactive demo to generate user activity and view live analytics."
        />
      </div>
    );
  }

  const { stats, events_over_time, recent_sessions } = data;

  const pieData = [
    { name: 'Page Views', value: stats.total_page_views },
    { name: 'Clicks', value: stats.total_clicks },
  ];

  const clickThroughRatio = stats.total_page_views > 0
    ? (stats.total_clicks / stats.total_page_views).toFixed(2)
    : '0.00';
  const eventsPerSession = stats.total_sessions > 0
    ? (stats.total_events / stats.total_sessions).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900 font-display">
              Overview
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Ingestion
            </span>
          </div>
          <p className="text-xs text-stone-500">
            Real-time session and interaction data across the past 14 days
          </p>
        </div>

        {/* Clean Metric summary tags */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs text-stone-600 flex items-center gap-2 shadow-xs">
            <span className="text-stone-400 font-medium">Click Ratio:</span>
            <span className="font-bold text-stone-900">{clickThroughRatio}</span>
            <span className="text-[11px] text-stone-400">clicks/view</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs text-stone-600 flex items-center gap-2 shadow-xs">
            <span className="text-stone-400 font-medium">Avg Depth:</span>
            <span className="font-bold text-stone-900">{eventsPerSession}</span>
            <span className="text-[11px] text-stone-400">events/session</span>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Sessions"
          value={formatNumber(stats.total_sessions)}
          icon={<Users className="w-4 h-4 text-stone-700" />}
          color="bg-stone-100 text-stone-700"
          subtitle={`${eventsPerSession} avg events`}
        />
        <StatCard
          label="Total Events"
          value={formatNumber(stats.total_events)}
          icon={<BarChart3 className="w-4 h-4 text-stone-700" />}
          color="bg-stone-100 text-stone-700"
          subtitle="All recorded events"
        />
        <StatCard
          label="Page Views"
          value={formatNumber(stats.total_page_views)}
          icon={<Eye className="w-4 h-4 text-stone-700" />}
          color="bg-stone-100 text-stone-700"
          subtitle="Navigation entries"
        />
        <StatCard
          label="Total Clicks"
          value={formatNumber(stats.total_clicks)}
          icon={<MousePointerClick className="w-4 h-4 text-stone-700" />}
          color="bg-stone-100 text-stone-700"
          subtitle={`${clickThroughRatio} per view`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events Over Time - Clean Area Chart */}
        <div className="lg:col-span-2 neutral-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-stone-100 text-stone-700">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 font-display">
                  Events Over Time
                </h3>
                <p className="text-xs text-stone-500">Volume distribution over 14-day timeline</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-stone-600">
                <span className="w-2.5 h-2.5 rounded-full bg-stone-900" />
                Page Views
              </span>
              <span className="flex items-center gap-1.5 text-stone-600">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                Clicks
              </span>
            </div>
          </div>

          {events_over_time.length === 0 ? (
            <EmptyState title="No event data yet" description="Generate user activity in the demo to populate charts" />
          ) : (
            <div className="h-[290px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={events_over_time} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradientNeutralPV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0f172a" stopOpacity={0.15} />
                      <stop offset="90%" stopColor="#0f172a" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="gradientNeutralClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d97706" stopOpacity={0.18} />
                      <stop offset="90%" stopColor="#d97706" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatShortDate}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="page_views"
                    stroke="#0f172a"
                    strokeWidth={2}
                    fill="url(#gradientNeutralPV)"
                    name="Page Views"
                  />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="#d97706"
                    strokeWidth={2}
                    fill="url(#gradientNeutralClicks)"
                    name="Clicks"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Event Composition Breakdown - Donut Chart */}
        <div className="neutral-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-stone-100 text-stone-700">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 font-display">
                  Event Breakdown
                </h3>
                <p className="text-xs text-stone-500">Clicks vs Page Views ratio</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-stone-700 bg-stone-100 px-2.5 py-0.5 rounded-full">
              Total: {stats.total_events}
            </span>
          </div>

          {stats.total_events === 0 ? (
            <EmptyState title="No events yet" description="Waiting for first tracked event" />
          ) : (
            <div className="h-[290px] w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="#ffffff"
                    strokeWidth={3}
                  >
                    {pieData.map((_, idx) => (
                      <Cell key={`pie-${idx}`} fill={PIE_COLORS[idx]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '12px', color: '#475569', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Recent Sessions Table */}
      <div className="neutral-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-stone-600" />
            <h3 className="text-sm font-bold text-stone-900 font-display">
              Recent Sessions
            </h3>
          </div>
          <button
            onClick={() => navigate('/sessions')}
            className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1 transition-colors group"
          >
            <span>View All Sessions</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

        {recent_sessions.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No sessions recorded yet"
              description="Interact with the demo page to generate data"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/60 text-stone-500 font-medium">
                  <th className="py-3 px-6">Session ID</th>
                  <th className="text-right py-3 px-6">Events</th>
                  <th className="text-right py-3 px-6">Views</th>
                  <th className="text-right py-3 px-6">Clicks</th>
                  <th className="text-right py-3 px-6">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {recent_sessions.map((s) => (
                  <tr
                    key={s.session_id}
                    className="hover:bg-stone-50/80 cursor-pointer transition-colors"
                    onClick={() => navigate(`/sessions/${s.session_id}`)}
                  >
                    <td className="py-3.5 px-6 font-mono text-stone-800 font-medium flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>{truncateSessionId(s.session_id, 22)}</span>
                    </td>
                    <td className="py-3.5 px-6 text-right font-semibold text-stone-900">
                      <span className="px-2 py-0.5 rounded-md bg-stone-100">
                        {s.total_events}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right text-stone-600">
                      {s.page_views}
                    </td>
                    <td className="py-3.5 px-6 text-right font-semibold text-amber-700">
                      {s.clicks}
                    </td>
                    <td className="py-3.5 px-6 text-right text-stone-500">
                      {formatDate(s.last_event_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
