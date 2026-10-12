import axios from 'axios';
import type {
  ApiResponse,
  OverviewData,
  SessionSummary,
  AnalyticsEvent,
  HeatmapData,
  TrackedPage,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export async function fetchOverview(): Promise<OverviewData> {
  const { data } = await api.get<ApiResponse<OverviewData>>('/overview');
  if (!data.success) throw new Error(data.error || 'Failed to fetch overview');
  return data.data!;
}

export async function fetchSessions(page = 1, limit = 20): Promise<{
  sessions: SessionSummary[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}> {
  const { data } = await api.get<ApiResponse<SessionSummary[]>>('/sessions', {
    params: { page, limit },
  });
  if (!data.success) throw new Error(data.error || 'Failed to fetch sessions');
  return { sessions: data.data!, meta: data.meta! };
}

export async function fetchSessionEvents(
  sessionId: string,
  page = 1,
  limit = 50
): Promise<{
  events: AnalyticsEvent[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}> {
  const { data } = await api.get<ApiResponse<AnalyticsEvent[]>>(
    `/sessions/${sessionId}/events`,
    { params: { page, limit } }
  );
  if (!data.success) throw new Error(data.error || 'Failed to fetch events');
  return { events: data.data!, meta: data.meta! };
}

export async function fetchHeatmapData(pageUrl: string): Promise<HeatmapData> {
  const { data } = await api.get<ApiResponse<HeatmapData>>('/heatmap', {
    params: { page_url: pageUrl },
  });
  if (!data.success) throw new Error(data.error || 'Failed to fetch heatmap data');
  return data.data!;
}

export async function fetchTrackedPages(): Promise<TrackedPage[]> {
  const { data } = await api.get<ApiResponse<TrackedPage[]>>('/pages');
  if (!data.success) throw new Error(data.error || 'Failed to fetch pages');
  return data.data!;
}

export async function fetchHealth(): Promise<Record<string, unknown>> {
  const { data } = await api.get<ApiResponse<Record<string, unknown>>>('/health');
  return data.data!;
}
