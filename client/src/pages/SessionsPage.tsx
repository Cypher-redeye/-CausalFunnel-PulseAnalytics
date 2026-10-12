import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
  Users,
  Copy,
  Check,
  ArrowRight,
} from 'lucide-react';
import { fetchSessions } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { LoadingState, ErrorState, EmptyState } from '../components/ui';
import { formatDate, truncateSessionId } from '../utils/formatters';
import type { SessionSummary } from '../types';

export default function SessionsPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const limit = 15;
  const navigate = useNavigate();

  const fetcher = useCallback(() => fetchSessions(page, limit), [page]);
  const { data, loading, error, refetch } = useAsync(fetcher, [page]);

  const handleCopyId = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const allSessions = data?.sessions;
  const filteredSessions = useMemo(() => {
    if (!allSessions) return [];
    if (!searchQuery.trim()) return allSessions;
    const query = searchQuery.toLowerCase();
    return allSessions.filter((s) => s.session_id.toLowerCase().includes(query));
  }, [allSessions, searchQuery]);

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

  const { meta } = data;

  return (
    <div className="space-y-6">
      {/* Editorial Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900 font-display">
              Sessions
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
              {meta.total} total session{meta.total !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-stone-500">
            Browse and inspect recorded visitor sessions, event sequences, and interaction journeys.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={refetch}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl transition-all shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
            Refresh
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by session ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all shadow-xs"
          />
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-stone-500 px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white">
          <span>Page {meta.page} of {meta.totalPages || 1}</span>
        </div>
      </div>

      {/* Clean Sessions Table */}
      <div className="neutral-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-600 font-semibold">
                <th className="py-3.5 px-6">Session ID</th>
                <th className="text-right py-3.5 px-6">Total Events</th>
                <th className="text-right py-3.5 px-6">Page Views</th>
                <th className="text-right py-3.5 px-6">Clicks</th>
                <th className="text-right py-3.5 px-6">First Activity</th>
                <th className="text-right py-3.5 px-6">Last Activity</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredSessions.map((s: SessionSummary) => (
                <tr
                  key={s.session_id}
                  className="hover:bg-stone-50/80 cursor-pointer transition-colors group"
                  onClick={() => navigate(`/sessions/${s.session_id}`)}
                >
                  <td className="py-4 px-6 text-stone-900">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="font-mono font-medium text-stone-800">{s.session_id}</span>
                      <button
                        onClick={(e) => handleCopyId(e, s.session_id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-opacity"
                        title="Copy Session ID"
                      >
                        {copiedId === s.session_id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right font-bold text-stone-900">
                    <span className="px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200/60">
                      {s.total_events}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right text-stone-600">
                    {s.page_views}
                  </td>
                  <td className="py-4 px-6 text-right font-semibold text-amber-700">
                    {s.clicks}
                  </td>
                  <td className="py-4 px-6 text-right text-stone-500">
                    {formatDate(s.first_event_at)}
                  </td>
                  <td className="py-4 px-6 text-right text-stone-500">
                    {formatDate(s.last_event_at)}
                  </td>
                  <td className="py-4 pr-5 text-right">
                    <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-stone-800 group-hover:translate-x-1 transition-all" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stone-100 bg-stone-50/40">
          <span className="text-xs text-stone-500">
            Page {meta.page} of {meta.totalPages || 1} · Showing {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-stone-600" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages}
              className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-stone-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
