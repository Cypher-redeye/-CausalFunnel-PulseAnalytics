import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import OverviewPage from '../pages/OverviewPage';
import * as api from '../services/api';

vi.mock('../services/api', () => ({
  fetchOverview: vi.fn(),
}));

const mockOverviewData = {
  stats: {
    total_sessions: 42,
    total_events: 185,
    total_page_views: 65,
    total_clicks: 120,
  },
  events_over_time: [
    { date: '2024-03-01', page_views: 10, clicks: 20, total: 30 },
    { date: '2024-03-02', page_views: 15, clicks: 25, total: 40 },
  ],
  recent_sessions: [
    {
      session_id: 'session-alpha-123',
      total_events: 8,
      page_views: 3,
      clicks: 5,
      first_event_at: '2024-03-01T10:00:00.000Z',
      last_event_at: '2024-03-01T10:15:00.000Z',
    },
  ],
};

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('OverviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(api.fetchOverview).mockReturnValue(new Promise(() => {}));
    renderWithRouter(<OverviewPage />);
    expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
  });

  it('renders error state when fetch fails', async () => {
    vi.mocked(api.fetchOverview).mockRejectedValue(new Error('Network error'));
    renderWithRouter(<OverviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('renders empty state when there are 0 sessions and 0 events', async () => {
    vi.mocked(api.fetchOverview).mockResolvedValue({
      stats: { total_sessions: 0, total_events: 0, total_page_views: 0, total_clicks: 0 },
      events_over_time: [],
      recent_sessions: [],
    });
    renderWithRouter(<OverviewPage />);

    await waitFor(() => {
      expect(screen.getByText('No sessions recorded yet')).toBeInTheDocument();
    });
  });

  it('renders stat cards and recent sessions on successful load', async () => {
    vi.mocked(api.fetchOverview).mockResolvedValue(mockOverviewData);
    renderWithRouter(<OverviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Total Sessions')).toBeInTheDocument();
    });

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('185')).toBeInTheDocument();
    expect(screen.getByText('65')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('Recent Sessions')).toBeInTheDocument();
  });
});
