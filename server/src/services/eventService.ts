import { Event, IEvent } from '../models/Event';

export interface SessionSummary {
  session_id: string;
  total_events: number;
  page_views: number;
  clicks: number;
  first_event_at: Date;
  last_event_at: Date;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OverviewStats {
  total_sessions: number;
  total_events: number;
  total_page_views: number;
  total_clicks: number;
}

export interface EventsOverTime {
  date: string;
  page_views: number;
  clicks: number;
  total: number;
}

class EventService {
  /**
   * Create a new analytics event
   */
  async createEvent(eventData: IEvent): Promise<IEvent> {
    const event = new Event({
      ...eventData,
      timestamp: new Date(eventData.timestamp),
    });
    return event.save();
  }

  /**
   * Get all sessions with aggregated summaries
   */
  async getSessions(page: number = 1, limit: number = 20): Promise<PaginatedResult<SessionSummary>> {
    const skip = (page - 1) * limit;

    // Count total unique sessions
    const totalResult = await Event.aggregate([
      { $group: { _id: '$session_id' } },
      { $count: 'total' },
    ]);
    const total = totalResult[0]?.total || 0;

    // Get paginated session summaries
    const sessions = await Event.aggregate([
      {
        $group: {
          _id: '$session_id',
          total_events: { $sum: 1 },
          page_views: {
            $sum: { $cond: [{ $eq: ['$event_type', 'page_view'] }, 1, 0] },
          },
          clicks: {
            $sum: { $cond: [{ $eq: ['$event_type', 'click'] }, 1, 0] },
          },
          first_event_at: { $min: '$timestamp' },
          last_event_at: { $max: '$timestamp' },
        },
      },
      { $sort: { last_event_at: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          session_id: '$_id',
          total_events: 1,
          page_views: 1,
          clicks: 1,
          first_event_at: 1,
          last_event_at: 1,
        },
      },
    ]);

    return {
      data: sessions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get events for a specific session
   */
  async getSessionEvents(
    sessionId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<PaginatedResult<IEvent>> {
    const skip = (page - 1) * limit;
    const total = await Event.countDocuments({ session_id: sessionId });

    const events = await Event.find({ session_id: sessionId })
      .sort({ timestamp: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      data: events as IEvent[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get click coordinates for heatmap
   */
  async getHeatmapData(
    pageUrl: string,
    limit: number = 1000
  ): Promise<{ clicks: Array<{ x: number; y: number; viewport?: { width: number; height: number } }>; total_clicks: number; page_url: string }> {
    const total_clicks = await Event.countDocuments({
      event_type: 'click',
      page_url: pageUrl,
    });

    const clicks = await Event.find({
      event_type: 'click',
      page_url: pageUrl,
      coordinates: { $exists: true },
    })
      .select('coordinates viewport -_id')
      .limit(limit)
      .lean();

    return {
      clicks: clicks.map((c) => ({
        x: c.coordinates!.x,
        y: c.coordinates!.y,
        viewport: c.viewport,
      })),
      total_clicks,
      page_url: pageUrl,
    };
  }

  /**
   * Get overview statistics
   */
  async getOverviewStats(): Promise<OverviewStats> {
    const result = await Event.aggregate([
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                total_events: { $sum: 1 },
                total_page_views: {
                  $sum: { $cond: [{ $eq: ['$event_type', 'page_view'] }, 1, 0] },
                },
                total_clicks: {
                  $sum: { $cond: [{ $eq: ['$event_type', 'click'] }, 1, 0] },
                },
              },
            },
          ],
          sessions: [
            { $group: { _id: '$session_id' } },
            { $count: 'total_sessions' },
          ],
        },
      },
    ]);

    const totals = result[0]?.totals[0] || { total_events: 0, total_page_views: 0, total_clicks: 0 };
    const sessions = result[0]?.sessions[0]?.total_sessions || 0;

    return {
      total_sessions: sessions,
      total_events: totals.total_events,
      total_page_views: totals.total_page_views,
      total_clicks: totals.total_clicks,
    };
  }

  /**
   * Get events grouped by day for charts
   */
  async getEventsOverTime(days: number = 30): Promise<EventsOverTime[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const result = await Event.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
          },
          page_views: {
            $sum: { $cond: [{ $eq: ['$event_type', 'page_view'] }, 1, 0] },
          },
          clicks: {
            $sum: { $cond: [{ $eq: ['$event_type', 'click'] }, 1, 0] },
          },
          total: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          page_views: 1,
          clicks: 1,
          total: 1,
        },
      },
    ]);

    // Map aggregation results by date
    const dateMap = new Map<string, EventsOverTime>();
    for (const item of result) {
      dateMap.set(item.date, item);
    }

    // Zero-fill date range (last 14 days) so charts always render a continuous timeline
    const timeline: EventsOverTime[] = [];
    const windowDays = Math.min(days, 14);
    const now = new Date();

    for (let i = windowDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (dateMap.has(dateStr)) {
        timeline.push(dateMap.get(dateStr)!);
      } else {
        timeline.push({
          date: dateStr,
          page_views: 0,
          clicks: 0,
          total: 0,
        });
      }
    }

    return timeline;
  }

  /**
   * Get list of tracked page URLs (for heatmap page selector)
   */
  async getTrackedPages(): Promise<Array<{ page_url: string; click_count: number }>> {
    const result = await Event.aggregate([
      { $match: { event_type: 'click' } },
      {
        $group: {
          _id: '$page_url',
          click_count: { $sum: 1 },
        },
      },
      { $sort: { click_count: -1 } },
      {
        $project: {
          _id: 0,
          page_url: '$_id',
          click_count: 1,
        },
      },
    ]);
    return result;
  }
}

export const eventService = new EventService();
