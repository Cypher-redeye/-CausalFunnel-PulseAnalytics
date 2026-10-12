import {
  BarChart3,
  Users,
  Eye,
  MousePointerClick,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Clock,
  Sparkles,
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

const PIE_COLORS = ['#3b82f6', '#10b981'];

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
      <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-3 shadow-xl backdrop-blur-md">
        <p className="text-[11px] font-mono font-medium text-slate-400 mb-2">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry, index) => (
            <div key={`tooltip-${index}`} className="flex items-center justify-between gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-semibold text-white">{entry.value}</span>
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
  if (!data) return <EmptyState title="No data available" />;

  const { stats, events_over_time, recent_sessions } = data;

  const pieData = [
    { name: 'Page Views', value: stats.total_page_views },
    { name: 'Clicks', value: stats.total_clicks },
  ];

  // Derived metrics from verified real data
  const clickThroughRatio = stats.total_page_views > 0
    ? (stats.total_clicks / stats.total_page_views).toFixed(2)
    : '0.00';
  const eventsPerSession = stats.total_sessions > 0
    ? (stats.total_events / stats.total_sessions).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Header telemetry banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold tracking-tight text-white">Overview</h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-[10px] font-mono text-blue-400">
              <Sparkles className="w-2.5 h-2.5" /> Live Metrics
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time pipeline aggregated over the last 14 days of ingestion
          </p>
        </div>

        {/* Telemetry pill indicators */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-xs font-mono text-slate-400 flex items-center gap-2">
            <span className="text-slate-500">Density:</span>
            <span className="text-emerald-400 font-semibold">{clickThroughRatio}</span>
            <span className="text-[10px] text-slate-400">clicks/view</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-xs font-mono text-slate-400 flex items-center gap-2">
            <span className="text-slate-500">Depth:</span>
            <span className="text-blue-400 font-semibold">{eventsPerSession}</span>
            <span className="text-[10px] text-slate-400">evts/sess</span>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Sessions"
          value={formatNumber(stats.total_sessions)}
          icon={<Users className="w-4 h-4 text-blue-400" />}
          color="bg-blue-500/10 text-blue-400"
          subtitle={`${eventsPerSession} avg events`}
        />
        <StatCard
          label="Total Events"
          value={formatNumber(stats.total_events)}
          icon={<BarChart3 className="w-4 h-4 text-purple-400" />}
          color="bg-purple-500/10 text-purple-400"
          subtitle="Page views + clicks"
        />
        <StatCard
          label="Page Views"
          value={formatNumber(stats.total_page_views)}
          icon={<Eye className="w-4 h-4 text-emerald-400" />}
          color="bg-emerald-500/10 text-emerald-400"
          subtitle="Navigation entries"
        />
        <StatCard
          label="Total Clicks"
          value={formatNumber(stats.total_clicks)}
          icon={<MousePointerClick className="w-4 h-4 text-amber-400" />}
          color="bg-amber-500/10 text-amber-400"
          subtitle={`${clickThroughRatio} per page view`}
        />
      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events Over Time - Area Chart */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800/90 bg-slate-900/60 backdrop-blur-md p-5 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold tracking-tight text-white">Events Over Time</h3>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                Page Views
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                Clicks
              </span>
            </div>
          </div>

          {events_over_time.length === 0 ? (
            <EmptyState title="No event data yet" description="Generate user activity in the demo to populate charts" />
          ) : (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={events_over_time} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradientPV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="gradientClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatShortDate}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#334155' }}
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
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#gradientPV)"
                    name="Page Views"
                  />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#gradientClicks)"
                    name="Clicks"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Event Composition Breakdown - Donut Chart */}
        <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 backdrop-blur-md p-5 shadow-lg shadow-black/20 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-semibold tracking-tight text-white">Event Breakdown</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Total: {stats.total_events}</span>
          </div>

          {stats.total_events === 0 ? (
            <EmptyState title="No events yet" description="Waiting for first tracked event" />
          ) : (
            <div className="h-[280px] w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="#0f172a"
                    strokeWidth={2}
                  >
                    {pieData.map((_, idx) => (
                      <Cell key={`pie-${idx}`} fill={PIE_COLORS[idx]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Recent Sessions Explorer */}
      <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 backdrop-blur-md shadow-lg shadow-black/20 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold tracking-tight text-white">Recent Sessions</h3>
          </div>
          <button
            onClick={() => navigate('/sessions')}
            className="text-xs font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recent_sessions.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No sessions recorded yet"
              description="Interact with the demo page to generate data"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/30 text-slate-400 font-mono">
                  <th className="py-3 px-5 font-medium">Session ID</th>
                  <th className="text-right py-3 px-5 font-medium">Events</th>
                  <th className="text-right py-3 px-5 font-medium">Page Views</th>
                  <th className="text-right py-3 px-5 font-medium">Clicks</th>
                  <th className="text-right py-3 px-5 font-medium">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recent_sessions.map((s) => (
                  <tr
                    key={s.session_id}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                    onClick={() => navigate(`/sessions/${s.session_id}`)}
                  >
                    <td className="py-3.5 px-5 font-mono text-blue-400 group-hover:text-blue-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 group-hover:scale-125 transition-transform" />
                      <span>{truncateSessionId(s.session_id, 22)}</span>
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono font-medium text-slate-200">
                      {s.total_events}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono text-slate-400">
                      {s.page_views}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono text-emerald-400">
                      {s.clicks}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono text-slate-400">
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
