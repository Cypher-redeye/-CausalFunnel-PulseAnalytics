import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SessionsPage from '../pages/SessionsPage';
import * as api from '../services/api';

vi.mock('../services/api', () => ({
  fetchSessions: vi.fn(),
}));

const mockSessionsData = {
  sessions: [
    {
      session_id: 'session-xyz-789',
      total_events: 12,
      page_views: 4,
      clicks: 8,
      first_event_at: '2024-03-01T10:00:00.000Z',
      last_event_at: '2024-03-01T10:30:00.000Z',
    },
    {
      session_id: 'session-abc-123',
      total_events: 5,
      page_views: 2,
      clicks: 3,
      first_event_at: '2024-03-01T11:00:00.000Z',
      last_event_at: '2024-03-01T11:10:00.000Z',
    },
  ],
  meta: {
    page: 1,
    limit: 15,
    total: 2,
    totalPages: 1,
  },
};

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('SessionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(api.fetchSessions).mockReturnValue(new Promise(() => {}));
    renderWithRouter(<SessionsPage />);
    expect(screen.getByText('Loading sessions...')).toBeInTheDocument();
  });

  it('renders error state when fetch fails', async () => {
    vi.mocked(api.fetchSessions).mockRejectedValue(new Error('Failed to retrieve sessions'));
    renderWithRouter(<SessionsPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to retrieve sessions')).toBeInTheDocument();
    });
  });

  it('renders empty state when there are 0 sessions', async () => {
    vi.mocked(api.fetchSessions).mockResolvedValue({
      sessions: [],
      meta: { page: 1, limit: 15, total: 0, totalPages: 0 },
    });
    renderWithRouter(<SessionsPage />);

    await waitFor(() => {
      expect(screen.getByText('No sessions found')).toBeInTheDocument();
    });
  });

  it('renders sessions table with rows and counts', async () => {
    vi.mocked(api.fetchSessions).mockResolvedValue(mockSessionsData);
    renderWithRouter(<SessionsPage />);

    await waitFor(() => {
      expect(screen.getByText('Sessions')).toBeInTheDocument();
    });

    expect(screen.getByText('2 total sessions')).toBeInTheDocument();
    expect(screen.getByText('session-xyz-789')).toBeInTheDocument();
    expect(screen.getByText('session-abc-123')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('refreshes sessions when refresh button is clicked', async () => {
    vi.mocked(api.fetchSessions).mockResolvedValue(mockSessionsData);
    renderWithRouter(<SessionsPage />);

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Refresh'));
    expect(api.fetchSessions).toHaveBeenCalledTimes(2);
  });
});
