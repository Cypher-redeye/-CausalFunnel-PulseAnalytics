import {
  BarChart3,
  Users,
  Eye,
  MousePointerClick,
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Overview</h2>
        <p className="text-sm text-gray-500 mt-1">Last 30 days of analytics data</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Sessions"
          value={formatNumber(stats.total_sessions)}
          icon={<Users className="w-5 h-5 text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          label="Total Events"
          value={formatNumber(stats.total_events)}
          icon={<BarChart3 className="w-5 h-5 text-purple-600" />}
          color="bg-purple-50"
        />
        <StatCard
          label="Page Views"
          value={formatNumber(stats.total_page_views)}
          icon={<Eye className="w-5 h-5 text-emerald-600" />}
          color="bg-emerald-50"
        />
        <StatCard
          label="Total Clicks"
          value={formatNumber(stats.total_clicks)}
          icon={<MousePointerClick className="w-5 h-5 text-amber-600" />}
          color="bg-amber-50"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events over time */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Events Over Time</h3>
          {events_over_time.length === 0 ? (
            <EmptyState title="No event data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={events_over_time}>
                <defs>
                  <linearGradient id="colorPV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatShortDate}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '13px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="page_views"
                  stroke="#3b82f6"
                  fill="url(#colorPV)"
                  strokeWidth={2}
                  name="Page Views"
                />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  stroke="#10b981"
                  fill="url(#colorClicks)"
                  strokeWidth={2}
                  name="Clicks"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Event type breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Event Breakdown</h3>
          {stats.total_events === 0 ? (
            <EmptyState title="No events yet" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '13px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '13px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent sessions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Recent Sessions</h3>
        </div>
        {recent_sessions.length === 0 ? (
          <EmptyState title="No sessions recorded yet" description="Interact with the demo page to generate data" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-5 text-gray-500 font-medium">Session</th>
                  <th className="text-right py-3 px-5 text-gray-500 font-medium">Events</th>
                  <th className="text-right py-3 px-5 text-gray-500 font-medium">Views</th>
                  <th className="text-right py-3 px-5 text-gray-500 font-medium">Clicks</th>
                  <th className="text-right py-3 px-5 text-gray-500 font-medium">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {recent_sessions.map((s) => (
                  <tr
                    key={s.session_id}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/sessions/${s.session_id}`)}
                  >
                    <td className="py-3 px-5 font-mono text-xs text-blue-600">
                      {truncateSessionId(s.session_id, 20)}
                    </td>
                    <td className="py-3 px-5 text-right text-gray-700">{s.total_events}</td>
                    <td className="py-3 px-5 text-right text-gray-700">{s.page_views}</td>
                    <td className="py-3 px-5 text-right text-gray-700">{s.clicks}</td>
                    <td className="py-3 px-5 text-right text-gray-400">
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
