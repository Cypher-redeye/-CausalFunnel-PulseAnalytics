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
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors"
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
    <div className="space-y-6">
      {/* Header and Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/sessions')}
            className="p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 hover:text-stone-900 transition-all shadow-xs"
            title="Back to Sessions"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold tracking-tight text-stone-900 font-display">
                Session Journey
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-xs font-semibold text-stone-700">
                Live Timeline
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-stone-600 font-medium break-all">{sessionId}</span>
              <button
                onClick={handleCopySession}
                className="p-1 rounded-md hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
                title="Copy Session ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Duration badge */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-xl border border-stone-200 bg-white text-xs text-stone-600 flex items-center gap-2 shadow-xs">
            <Clock className="w-3.5 h-3.5 text-stone-500" />
            <span className="text-stone-400 font-medium">Session Duration:</span>
            <span className="font-bold text-stone-900">{durationStr}</span>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="neutral-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-stone-100 text-stone-700">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Total Events</p>
            <p className="text-2xl font-bold text-stone-900 font-display">{events.length}</p>
          </div>
        </div>

        <div className="neutral-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-stone-100 text-stone-700">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Page Views</p>
            <p className="text-2xl font-bold text-stone-900 font-display">{pageViews}</p>
          </div>
        </div>

        <div className="neutral-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
            <MousePointerClick className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Clicks</p>
            <p className="text-2xl font-bold text-amber-800 font-display">{clicks}</p>
          </div>
        </div>
      </div>

      {/* Chronological Event Waterfall */}
      <div className="neutral-card p-6">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-stone-600" />
            <h3 className="text-sm font-bold text-stone-900 font-display">Event Timeline</h3>
          </div>
          <span className="text-xs font-medium text-stone-500">{events.length} sequence steps recorded</span>
        </div>

        <div className="relative pl-7">
          {/* Subtle vertical connection line */}
          <div className="absolute left-[13px] top-4 bottom-4 w-[2px] bg-stone-200" />

          <div className="space-y-4">
            {events.map((event, idx) => {
              const isPageView = event.event_type === 'page_view';
              return (
                <div key={idx} className="relative flex items-start gap-4 group">
                  {/* Step node dot */}
                  <div
                    className={`relative z-10 w-7 h-7 -ml-7 rounded-full border flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 shadow-xs ${
                      isPageView
                        ? 'border-stone-300 bg-white text-stone-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700'
                    }`}
                  >
                    {isPageView ? (
                      <Eye className="w-3.5 h-3.5" />
                    ) : (
                      <MousePointerClick className="w-3.5 h-3.5" />
                    )}
                  </div>

                  {/* Step details card */}
                  <div className="flex-1 rounded-xl border border-stone-200 bg-white p-4 transition-all duration-150 hover:border-stone-300 hover:shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                            isPageView
                              ? 'border-stone-200 bg-stone-100 text-stone-700'
                              : 'border-amber-200 bg-amber-50 text-amber-800'
                          }`}
                        >
                          {isPageView ? 'Page View' : 'Click Interaction'}
                        </span>
                        <span className="text-xs text-stone-400 font-medium">
                          Step {idx + 1}
                        </span>
                      </div>
                      <span className="text-xs text-stone-500">
                        {formatDate(event.timestamp)}
                      </span>
                    </div>

                    {/* Page URL */}
                    <div className="text-xs text-stone-700 font-mono bg-stone-50 px-3 py-2 rounded-lg border border-stone-100 mb-2.5 break-all">
                      {event.page_url}
                    </div>

                    {/* Click coordinates & viewport info */}
                    {event.coordinates && (
                      <div className="flex flex-wrap items-center gap-2.5 text-xs text-stone-600 pt-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 font-medium">
                          <MousePointerClick className="w-3.5 h-3.5 text-stone-500" />
                          Position: ({event.coordinates.x}, {event.coordinates.y})
                        </span>
                        {event.viewport && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-100 text-stone-600 font-medium">
                            <Monitor className="w-3.5 h-3.5 text-stone-500" />
                            Viewport: {event.viewport.width} × {event.viewport.height}
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
