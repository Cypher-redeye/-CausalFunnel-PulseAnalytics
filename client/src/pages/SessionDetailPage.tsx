import { useParams, useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { ArrowLeft, Eye, MousePointerClick, Clock } from 'lucide-react';
import { fetchSessionEvents } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { LoadingState, ErrorState, EmptyState } from '../components/ui';
import { formatDate } from '../utils/formatters';

export default function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const fetcher = useCallback(
    () => fetchSessionEvents(sessionId!),
    [sessionId]
  );
  const { data, loading, error, refetch } = useAsync(fetcher, [sessionId]);

  if (loading) return <LoadingState message="Loading session events..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data || data.events.length === 0) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/sessions')}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Sessions
        </button>
        <EmptyState title="No events found for this session" />
      </div>
    );
  }

  const { events } = data;
  const pageViews = events.filter((e) => e.event_type === 'page_view').length;
  const clicks = events.filter((e) => e.event_type === 'click').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/sessions')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">User Journey</h2>
          <p className="text-sm text-gray-500 font-mono mt-0.5">{sessionId}</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="flex gap-4 flex-wrap">
        <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
          <Clock className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">Total Events</p>
            <p className="text-lg font-bold text-gray-900">{events.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
          <Eye className="w-4 h-4 text-blue-500" />
          <div>
            <p className="text-xs text-gray-500">Page Views</p>
            <p className="text-lg font-bold text-gray-900">{pageViews}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
          <MousePointerClick className="w-4 h-4 text-emerald-500" />
          <div>
            <p className="text-xs text-gray-500">Clicks</p>
            <p className="text-lg font-bold text-gray-900">{clicks}</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-5">Event Timeline</h3>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />

          <div className="space-y-4">
            {events.map((event, idx) => {
              const isPageView = event.event_type === 'page_view';
              return (
                <div key={idx} className="flex gap-4 relative">
                  {/* Dot */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      isPageView
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-emerald-100 text-emerald-600'
                    }`}
                  >
                    {isPageView ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <MousePointerClick className="w-4 h-4" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-semibold uppercase tracking-wide ${
                          isPageView ? 'text-blue-600' : 'text-emerald-600'
                        }`}
                      >
                        {isPageView ? 'Page View' : 'Click'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(event.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 break-all">{event.page_url}</p>
                    {event.coordinates && (
                      <p className="text-xs text-gray-400 mt-1">
                        Coordinates: ({event.coordinates.x}, {event.coordinates.y})
                        {event.viewport && (
                          <span>
                            {' · '}Viewport: {event.viewport.width}×{event.viewport.height}
                          </span>
                        )}
                      </p>
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
