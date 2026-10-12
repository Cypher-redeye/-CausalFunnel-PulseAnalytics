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
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
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

  // Calculate session duration if timestamps available
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
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/sessions')}
            className="p-2 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Back to Sessions"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-xl font-bold tracking-tight text-white">User Journey</h2>
              <span className="px-2 py-0.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-[10px] font-mono text-blue-400">
                Waterfall Trace
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400 break-all">{sessionId}</span>
              <button
                onClick={handleCopySession}
                className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
                title="Copy Session ID"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* Quick summary badges */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-xs font-mono text-slate-400 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500">Duration:</span>
            <span className="text-white font-medium">{durationStr}</span>
          </div>
        </div>
      </div>

      {/* Metric telemetry cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 backdrop-blur-md p-4 flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Total Events</p>
            <p className="text-xl font-bold font-mono text-white">{events.length}</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 backdrop-blur-md p-4 flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Page Views</p>
            <p className="text-xl font-bold font-mono text-blue-400">{pageViews}</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 backdrop-blur-md p-4 flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <MousePointerClick className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Clicks</p>
            <p className="text-xl font-bold font-mono text-emerald-400">{clicks}</p>
          </div>
        </div>
      </div>

      {/* Chronological Event Waterfall */}
      <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 backdrop-blur-md p-6 shadow-lg shadow-black/20">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold tracking-tight text-white">Event Timeline</h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Chronological Order (1 to {events.length})</span>
        </div>

        <div className="relative pl-6">
          {/* Vertical waterfall spine */}
          <div className="absolute left-[11px] top-3 bottom-3 w-[2px] bg-gradient-to-b from-blue-500 via-slate-800 to-emerald-500 opacity-60" />

          <div className="space-y-4">
            {events.map((event, idx) => {
              const isPageView = event.event_type === 'page_view';
              return (
                <div key={idx} className="relative flex items-start gap-4 group">
                  {/* Step node dot */}
                  <div
                    className={`relative z-10 w-6 h-6 -ml-6 rounded-full border flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 shadow-sm ${
                      isPageView
                        ? 'border-blue-500/50 bg-blue-950/80 text-blue-400'
                        : 'border-emerald-500/50 bg-emerald-950/80 text-emerald-400'
                    }`}
                  >
                    {isPageView ? (
                      <Eye className="w-3 h-3" />
                    ) : (
                      <MousePointerClick className="w-3 h-3" />
                    )}
                  </div>

                  {/* Step details card */}
                  <div className="flex-1 rounded-xl border border-slate-800/90 bg-slate-950/60 hover:bg-slate-900/80 p-4 transition-all duration-150">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                            isPageView
                              ? 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
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
                    <div className="font-mono text-xs text-slate-300 break-all bg-slate-900/80 px-2.5 py-1.5 rounded border border-slate-800/80 mb-2">
                      {event.page_url}
                    </div>

                    {/* Click coordinates & viewport telemetry */}
                    {event.coordinates && (
                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400 pt-1">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/20 border border-emerald-500/20 text-emerald-300">
                          <MousePointerClick className="w-3 h-3 text-emerald-400" />
                          Coordinates: ({event.coordinates.x}, {event.coordinates.y})
                        </span>
                        {event.viewport && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                            <Monitor className="w-3 h-3 text-slate-500" />
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
