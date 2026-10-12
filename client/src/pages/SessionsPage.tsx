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
    <div className="space-y-6 relative">
      {/* Editorial Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white font-display text-gradient-silver">
              Sessions
            </h2>
            <span className="text-xs font-mono px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
              {meta.total} total session{meta.total !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs font-mono text-slate-400">
            [ ARCHIVE // INGESTED CLIENT SESSIONS & EVENT TIMESTAMPS ]
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={refetch}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-medium text-slate-200 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-xl transition-all shadow-sm hover:border-white/20"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            Refresh
          </button>
        </div>
      </div>

      {/* Search and filter controls */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by session ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-white/10 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/60 transition-all shadow-inner"
          />
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400 px-3.5 py-2.5 rounded-xl border border-white/10 bg-slate-950/50 backdrop-blur-md">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          <span>Page {meta.page} / {meta.totalPages || 1}</span>
        </div>
      </div>

      {/* Luxury Sessions table */}
      <div className="rounded-2xl border border-white/[0.08] bg-slate-950/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02] text-slate-400 font-mono text-[11px]">
                <th className="py-3.5 px-6 font-medium">Session ID</th>
                <th className="text-right py-3.5 px-6 font-medium">Total Events</th>
                <th className="text-right py-3.5 px-6 font-medium">Page Views</th>
                <th className="text-right py-3.5 px-6 font-medium">Clicks</th>
                <th className="text-right py-3.5 px-6 font-medium">First Activity</th>
                <th className="text-right py-3.5 px-6 font-medium">Last Activity</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredSessions.map((s: SessionSummary) => (
                <tr
                  key={s.session_id}
                  className="hover:bg-white/[0.03] cursor-pointer transition-colors group"
                  onClick={() => navigate(`/sessions/${s.session_id}`)}
                >
                  <td className="py-4 px-6 font-mono text-cyan-400 group-hover:text-cyan-300">
                    <div className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 group-hover:scale-125 transition-transform shrink-0 shadow-[0_0_8px_#22d3ee]" />
                      <span className="font-semibold">{truncateSessionId(s.session_id, 24)}</span>
                      <button
                        onClick={(e) => handleCopyId(e, s.session_id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-opacity"
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
                  <td className="py-4 px-6 text-right font-mono font-bold text-white">
                    <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/5">
                      {s.total_events}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right font-mono text-slate-400">
                    {s.page_views}
                  </td>
                  <td className="py-4 px-6 text-right font-mono text-emerald-400 font-semibold">
                    {s.clicks}
                  </td>
                  <td className="py-4 px-6 text-right font-mono text-slate-400">
                    {formatDate(s.first_event_at)}
                  </td>
                  <td className="py-4 px-6 text-right font-mono text-slate-400">
                    {formatDate(s.last_event_at)}
                  </td>
                  <td className="py-4 pr-5 text-right">
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.08] bg-white/[0.01]">
          <span className="text-[11px] font-mono text-slate-400">
            Page {meta.page} of {meta.totalPages || 1} · Showing {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl border border-white/10 bg-slate-900/80 hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-cyan-400 px-3 font-semibold">
              {meta.page}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages}
              className="p-2 rounded-xl border border-white/10 bg-slate-900/80 hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
