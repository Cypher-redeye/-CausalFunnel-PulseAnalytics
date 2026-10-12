import { useParams, useNavigate } from 'react-router-dom';
import { useCallback, useState } from 'react';
import {
  ArrowLeft,
  Eye,
  MousePointerClick,
  Clock,
  Layers,
  Copy,
  Check,
  Compass,
  Monitor,
} from 'lucide-react';
import { fetchSessionEvents } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { LoadingState, ErrorState, EmptyState } from '../components/ui';
import { formatDate } from '../utils/formatters';

export default function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const fetcher = useCallback(
    () => fetchSessionEvents(sessionId!),
    [sessionId]
  );
  const { data, loading, error, refetch } = useAsync(fetcher, [sessionId]);

  const handleCopySession = () => {
    if (sessionId) {
      navigator.clipboard.writeText(sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return <LoadingState message="Loading session events..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data || data.events.length === 0) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/sessions')}
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sessions
        </button>
        <EmptyState title="No events found for this session" description="No telemetry data recorded for this identifier" />
      </div>
    );
  }

  const { events } = data;
  const pageViews = events.filter((e) => e.event_type === 'page_view').length;
  const clicks = events.filter((e) => e.event_type === 'click').length;

  // Calculate session duration
  let durationStr = 'Active';
  if (events.length > 1) {
    const start = new Date(events[0].timestamp).getTime();
    const end = new Date(events[events.length - 1].timestamp).getTime();
    const diffSec = Math.max(0, Math.round((end - start) / 1000));
    if (diffSec < 60) {
      durationStr = `${diffSec}s`;
    } else {
      const min = Math.floor(diffSec / 60);
      const sec = diffSec % 60;
      durationStr = `${min}m ${sec}s`;
    }
  }

  return (
    <div className="space-y-6 relative">
      {/* Editorial Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/sessions')}
            className="p-2.5 rounded-xl border border-white/10 bg-slate-900/80 hover:bg-white/10 text-slate-400 hover:text-white transition-all shadow-sm"
            title="Back to Sessions"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h2 className="text-2xl font-extrabold tracking-tight text-white font-display text-gradient-silver">
                User Journey
              </h2>
              <span className="px-2.5 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-[10px] font-mono text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                [ TRACE HUD ]
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400 break-all">{sessionId}</span>
              <button
                onClick={handleCopySession}
                className="p-1 rounded-md hover:bg-white/10 text-slate-500 hover:text-cyan-400 transition-colors"
                title="Copy Session ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Quick summary badges */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl border border-white/10 bg-slate-950/60 backdrop-blur-md text-xs font-mono text-slate-400 flex items-center gap-2.5 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-500">Duration:</span>
            <span className="text-white font-bold">{durationStr}</span>
          </div>
        </div>
      </div>

      {/* Metric telemetry cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/[0.08] bg-slate-950/60 backdrop-blur-xl p-5 flex items-center gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Total Events</p>
            <p className="text-2xl font-bold font-mono text-white">{events.length}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-slate-950/60 backdrop-blur-xl p-5 flex items-center gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="p-3 rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Page Views</p>
            <p className="text-2xl font-bold font-mono text-cyan-400">{pageViews}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-slate-950/60 backdrop-blur-xl p-5 flex items-center gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <MousePointerClick className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Clicks</p>
            <p className="text-2xl font-bold font-mono text-emerald-400">{clicks}</p>
          </div>
        </div>
      </div>

      {/* Chronological Event Waterfall */}
      <div className="rounded-2xl border border-white/[0.08] bg-slate-950/60 backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <Compass className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold tracking-tight text-white font-display">Event Timeline</h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">[ 1 TO {events.length} CHRONOLOGICAL SEQUENCE ]</span>
        </div>

        <div className="relative pl-7">
          {/* Vertical neon waterfall spine */}
          <div className="absolute left-[13px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-cyan-400 via-blue-500 to-emerald-400 opacity-60 shadow-[0_0_12px_#22d3ee]" />

          <div className="space-y-4">
            {events.map((event, idx) => {
              const isPageView = event.event_type === 'page_view';
              return (
                <div key={idx} className="relative flex items-start gap-4 group">
                  {/* Step node dot */}
                  <div
                    className={`relative z-10 w-7 h-7 -ml-7 rounded-full border flex items-center justify-center shrink-0 transition-transform group-hover:scale-125 shadow-md ${
                      isPageView
                        ? 'border-cyan-400/50 bg-cyan-950/90 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.4)]'
                        : 'border-emerald-400/50 bg-emerald-950/90 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.4)]'
                    }`}
                  >
                    {isPageView ? (
                      <Eye className="w-3.5 h-3.5" />
                    ) : (
                      <MousePointerClick className="w-3.5 h-3.5" />
                    )}
                  </div>

                  {/* Step details card */}
                  <div className="flex-1 rounded-2xl border border-white/[0.08] bg-slate-950/70 hover:bg-slate-900/80 hover:border-white/20 p-4 transition-all duration-200 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                            isPageView
                              ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                          }`}
                        >
                          {isPageView ? 'Page View' : 'Click'}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          Step #{idx + 1}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">
                        {formatDate(event.timestamp)}
                      </span>
                    </div>

                    {/* Page URL */}
                    <div className="font-mono text-xs text-slate-300 break-all bg-white/[0.03] px-3 py-2 rounded-xl border border-white/5 mb-2.5">
                      {event.page_url}
                    </div>

                    {/* Click coordinates & viewport telemetry */}
                    {event.coordinates && (
                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400 pt-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-emerald-300">
                          <MousePointerClick className="w-3.5 h-3.5 text-emerald-400" />
                          Coordinates: ({event.coordinates.x}, {event.coordinates.y})
                        </span>
                        {event.viewport && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-slate-400">
                            <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                            Viewport: {event.viewport.width}×{event.viewport.height}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
