import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchSessions } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { LoadingState, ErrorState, EmptyState } from '../components/ui';
import { formatDate, truncateSessionId } from '../utils/formatters';
import type { SessionSummary } from '../types';

export default function SessionsPage() {
  const [page, setPage] = useState(1);
  const limit = 15;
  const navigate = useNavigate();

  const fetcher = useCallback(() => fetchSessions(page, limit), [page]);
  const { data, loading, error, refetch } = useAsync(fetcher, [page]);

  if (loading) return <LoadingState message="Loading sessions..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data || data.sessions.length === 0) {
    return (
      <EmptyState
        title="No sessions found"
        description="Visit the demo website to generate analytics data"
      />
    );
  }

  const { sessions, meta } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Sessions</h2>
          <p className="text-sm text-gray-500 mt-1">
            {meta.total} total session{meta.total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="text-left py-3 px-5 text-gray-500 font-medium">Session ID</th>
                <th className="text-right py-3 px-5 text-gray-500 font-medium">Total Events</th>
                <th className="text-right py-3 px-5 text-gray-500 font-medium">Page Views</th>
                <th className="text-right py-3 px-5 text-gray-500 font-medium">Clicks</th>
                <th className="text-right py-3 px-5 text-gray-500 font-medium">First Activity</th>
                <th className="text-right py-3 px-5 text-gray-500 font-medium">Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s: SessionSummary) => (
                <tr
                  key={s.session_id}
                  className="border-b border-gray-50 hover:bg-blue-50/30 cursor-pointer transition-colors"
                  onClick={() => navigate(`/sessions/${s.session_id}`)}
                >
                  <td className="py-3 px-5 font-mono text-xs text-blue-600 hover:text-blue-800">
                    {truncateSessionId(s.session_id, 24)}
                  </td>
                  <td className="py-3 px-5 text-right text-gray-700 font-medium">{s.total_events}</td>
                  <td className="py-3 px-5 text-right text-gray-700">{s.page_views}</td>
                  <td className="py-3 px-5 text-right text-gray-700">{s.clicks}</td>
                  <td className="py-3 px-5 text-right text-gray-400 text-xs">{formatDate(s.first_event_at)}</td>
                  <td className="py-3 px-5 text-right text-gray-400 text-xs">{formatDate(s.last_event_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/30">
          <span className="text-xs text-gray-500">
            Page {meta.page} of {meta.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages}
              className="p-1.5 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
