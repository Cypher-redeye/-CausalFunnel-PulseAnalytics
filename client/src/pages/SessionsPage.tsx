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
  Filter,
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
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold tracking-tight text-white">Sessions</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full border border-slate-800 bg-slate-900/80 text-slate-400">
              {meta.total} total session{meta.total !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Inspect individual user sessions, interaction volumes, and timestamps
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refetch}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 rounded-lg transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            Refresh
          </button>
        </div>
      </div>

      {/* Search and filter controls */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by session ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/80 transition-all"
          />
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-slate-500 px-3 py-2 rounded-lg border border-slate-800 bg-slate-950/40">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>Page {meta.page} / {meta.totalPages || 1}</span>
        </div>
      </div>

      {/* Sessions table */}
      <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 backdrop-blur-md shadow-lg shadow-black/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/40 text-slate-400 font-mono">
                <th className="py-3 px-5 font-medium">Session ID</th>
                <th className="text-right py-3 px-5 font-medium">Total Events</th>
                <th className="text-right py-3 px-5 font-medium">Page Views</th>
                <th className="text-right py-3 px-5 font-medium">Clicks</th>
                <th className="text-right py-3 px-5 font-medium">First Activity</th>
                <th className="text-right py-3 px-5 font-medium">Last Activity</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredSessions.map((s: SessionSummary) => (
                <tr
                  key={s.session_id}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  onClick={() => navigate(`/sessions/${s.session_id}`)}
                >
                  <td className="py-3.5 px-5 font-mono text-blue-400 group-hover:text-blue-300">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 group-hover:scale-125 transition-transform shrink-0" />
                      <span className="font-semibold">{truncateSessionId(s.session_id, 24)}</span>
                      <button
                        onClick={(e) => handleCopyId(e, s.session_id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-700/60 text-slate-400 hover:text-white transition-opacity"
                        title="Copy Session ID"
                      >
                        {copiedId === s.session_id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono font-medium text-white">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700/60">
                      {s.total_events}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono text-slate-400">
                    {s.page_views}
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono text-emerald-400">
                    {s.clicks}
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono text-slate-400">
                    {formatDate(s.first_event_at)}
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono text-slate-400">
                    {formatDate(s.last_event_at)}
                  </td>
                  <td className="py-3.5 pr-4 text-right">
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800/80 bg-slate-950/40">
          <span className="text-[11px] font-mono text-slate-400">
            Page {meta.page} of {meta.totalPages || 1} · Showing {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-400 px-2">
              {meta.page}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
