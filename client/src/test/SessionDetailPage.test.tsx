import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import SessionDetailPage from '../pages/SessionDetailPage';
import * as api from '../services/api';

vi.mock('../services/api', () => ({
  fetchSessionEvents: vi.fn(),
}));

const mockEventsData = {
  events: [
    {
      session_id: 'test-session-42',
      event_type: 'page_view' as const,
      page_url: 'http://localhost:5173/demo',
      timestamp: '2024-03-01T10:00:00.000Z',
    },
    {
      session_id: 'test-session-42',
      event_type: 'click' as const,
      page_url: 'http://localhost:5173/demo',
      timestamp: '2024-03-01T10:01:00.000Z',
      coordinates: { x: 350, y: 120 },
      viewport: { width: 1440, height: 900 },
    },
  ],
  meta: {
    page: 1,
    limit: 50,
    total: 2,
    totalPages: 1,
  },
};

function renderWithRoute(sessionId = 'test-session-42') {
  return render(
    <MemoryRouter initialEntries={[`/sessions/${sessionId}`]}>
      <Routes>
        <Route path="/sessions/:sessionId" element={<SessionDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('SessionDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(api.fetchSessionEvents).mockReturnValue(new Promise(() => {}));
    renderWithRoute();
    expect(screen.getByText('Loading session events...')).toBeInTheDocument();
  });

  it('renders error state on API failure', async () => {
    vi.mocked(api.fetchSessionEvents).mockRejectedValue(new Error('Session not found'));
    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByText('Session not found')).toBeInTheDocument();
    });
  });

  it('renders empty state when session has no events', async () => {
    vi.mocked(api.fetchSessionEvents).mockResolvedValue({
      events: [],
      meta: { page: 1, limit: 50, total: 0, totalPages: 0 },
    });
    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByText('No events found for this session')).toBeInTheDocument();
    });
  });

  it('renders event journey timeline with page views and clicks', async () => {
    vi.mocked(api.fetchSessionEvents).mockResolvedValue(mockEventsData);
    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByText('User Journey')).toBeInTheDocument();
    });

    expect(screen.getByText('test-session-42')).toBeInTheDocument();
    expect(screen.getByText('Event Timeline')).toBeInTheDocument();
    expect(screen.getByText('Page View')).toBeInTheDocument();
    expect(screen.getByText('Click')).toBeInTheDocument();
    expect(screen.getByText(/Coordinates:/)).toBeInTheDocument();
  });
});
