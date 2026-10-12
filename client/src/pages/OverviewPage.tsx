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
  Zap,
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

const PIE_COLORS = ['#f59e0b', '#f97316'];

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
      <div className="rounded-xl border border-stone-800 bg-stone-950/95 p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        <p className="text-[11px] font-mono text-stone-400 mb-2 flex items-center justify-between gap-4">
          <span>{label}</span>
          <span className="text-amber-400 font-semibold">[ HORIZON ]</span>
        </p>
        <div className="space-y-1.5">
          {payload.map((entry, index) => (
            <div key={`tooltip-${index}`} className="flex items-center justify-between gap-6 text-xs font-mono">
              <span className="flex items-center gap-2 text-stone-300">
                <span className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: entry.color, color: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-bold text-white">{entry.value}</span>
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

  // Derived real metrics
  const clickThroughRatio = stats.total_page_views > 0
    ? (stats.total_clicks / stats.total_page_views).toFixed(2)
    : '0.00';
  const eventsPerSession = stats.total_sessions > 0
    ? (stats.total_events / stats.total_sessions).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6 relative">
      {/* Editorial Headline & Telemetry HUD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800 relative">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h2 className="text-2xl font-extrabold tracking-tight text-white font-display text-gradient-silver">
              Overview
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-[10px] font-mono text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              <Sparkles className="w-3 h-3" /> Live Metrics
            </span>
          </div>
          <p className="text-xs font-mono text-stone-400">
            [ HORIZON: 14 DAYS // SYSTEM PIPELINE: REALTIME SYNC ]
          </p>
        </div>

        {/* Telemetry pill indicators */}
        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1.5 rounded-xl border border-stone-800 bg-stone-900/60 backdrop-blur-md text-xs font-mono text-stone-400 flex items-center gap-2 shadow-sm">
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="text-stone-500">Density:</span>
            <span className="text-amber-400 font-bold">{clickThroughRatio}</span>
            <span className="text-[10px] text-stone-500">clicks/view</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl border border-stone-800 bg-stone-900/60 backdrop-blur-md text-xs font-mono text-stone-400 flex items-center gap-2 shadow-sm">
            <Activity className="w-3 h-3 text-orange-400" />
            <span className="text-stone-500">Depth:</span>
            <span className="text-orange-400 font-bold">{eventsPerSession}</span>
            <span className="text-[10px] text-stone-500">evts/sess</span>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Sessions"
          value={formatNumber(stats.total_sessions)}
          icon={<Users className="w-4 h-4 text-amber-400" />}
          color="bg-amber-500/10 text-amber-400"
          subtitle={`${eventsPerSession} avg events`}
        />
        <StatCard
          label="Total Events"
          value={formatNumber(stats.total_events)}
          icon={<BarChart3 className="w-4 h-4 text-orange-400" />}
          color="bg-orange-500/10 text-orange-400"
          subtitle="Page views + clicks"
        />
        <StatCard
          label="Page Views"
          value={formatNumber(stats.total_page_views)}
          icon={<Eye className="w-4 h-4 text-amber-300" />}
          color="bg-amber-500/10 text-amber-300"
          subtitle="Navigation entries"
        />
        <StatCard
          label="Total Clicks"
          value={formatNumber(stats.total_clicks)}
          icon={<MousePointerClick className="w-4 h-4 text-rose-400" />}
          color="bg-rose-500/10 text-rose-400"
          subtitle={`${clickThroughRatio} per view`}
        />
      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events Over Time - Luminous Neon Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-stone-800/80 bg-stone-900/60 backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden group">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-white font-display">
                  Events Over Time
                </h3>
                <p className="text-[10px] font-mono text-stone-500">Volume distribution over 14-day timeline</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-2 text-stone-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
                Page Views
              </span>
              <span className="flex items-center gap-2 text-stone-400">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shadow-[0_0_8px_#f97316]" />
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
                    <linearGradient id="gradientAwwwardsPV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.45} />
                      <stop offset="90%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="gradientAwwwardsClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity={0.45} />
                      <stop offset="90%" stopColor="#f97316" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatShortDate}
                    tick={{ fontSize: 10, fill: '#78716c', fontFamily: 'JetBrains Mono' }}
                    axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#78716c', fontFamily: 'JetBrains Mono' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="page_views"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    fill="url(#gradientAwwwardsPV)"
                    name="Page Views"
                  />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="#fb923c"
                    strokeWidth={2.5}
                    fill="url(#gradientAwwwardsClicks)"
                    name="Clicks"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Event Composition Breakdown - Donut Chart */}
        <div className="rounded-2xl border border-stone-800/80 bg-stone-900/60 backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-white font-display">
                  Event Breakdown
                </h3>
                <p className="text-[10px] font-mono text-stone-500">Clicks vs Page Views ratio</p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-500/20">
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
                    innerRadius={60}
                    outerRadius={92}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="#141210"
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
                    wrapperStyle={{ fontSize: '11px', color: '#a8a29e', fontFamily: 'JetBrains Mono' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Recent Sessions Explorer */}
      <div className="rounded-2xl border border-stone-800/80 bg-stone-900/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-white/[0.01]">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold tracking-tight text-white font-display">
              Recent Sessions
            </h3>
          </div>
          <button
            onClick={() => navigate('/sessions')}
            className="text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors group"
          >
            <span>View All</span>
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
                <tr className="border-b border-stone-800 bg-white/[0.01] text-stone-400 font-mono text-[11px]">
                  <th className="py-3 px-6 font-medium">Session ID</th>
                  <th className="text-right py-3 px-6 font-medium">Events</th>
                  <th className="text-right py-3 px-6 font-medium">Views</th>
                  <th className="text-right py-3 px-6 font-medium">Clicks</th>
                  <th className="text-right py-3 px-6 font-medium">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {recent_sessions.map((s) => (
                  <tr
                    key={s.session_id}
                    className="hover:bg-stone-800/40 cursor-pointer transition-colors group"
                    onClick={() => navigate(`/sessions/${s.session_id}`)}
                  >
                    <td className="py-4 px-6 font-mono text-amber-400 group-hover:text-amber-300 flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 group-hover:scale-125 transition-transform shrink-0 shadow-[0_0_8px_#f59e0b]" />
                      <span>{truncateSessionId(s.session_id, 22)}</span>
                    </td>
                    <td className="py-4 px-6 text-right font-mono font-bold text-white">
                      <span className="px-2 py-0.5 rounded-md bg-stone-800/60 border border-stone-700/50">
                        {s.total_events}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-stone-400">
                      {s.page_views}
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-orange-400 font-semibold">
                      {s.clicks}
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-stone-400">
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
