export interface Coordinates {
  x: number;
  y: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export interface AnalyticsEvent {
  _id?: string;
  session_id: string;
  event_type: 'page_view' | 'click';
  page_url: string;
  timestamp: string;
  coordinates?: Coordinates;
  viewport?: Viewport;
  is_demo?: boolean;
}

export interface SessionSummary {
  session_id: string;
  total_events: number;
  page_views: number;
  clicks: number;
  first_event_at: string;
  last_event_at: string;
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

export interface OverviewData {
  stats: OverviewStats;
  events_over_time: EventsOverTime[];
  recent_sessions: SessionSummary[];
}

export interface HeatmapData {
  clicks: Array<{ x: number; y: number; viewport?: Viewport }>;
  total_clicks: number;
  page_url: string;
}

export interface TrackedPage {
  page_url: string;
  click_count: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
  meta?: PaginationMeta;
}
