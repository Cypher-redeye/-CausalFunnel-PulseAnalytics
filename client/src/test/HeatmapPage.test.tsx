import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HeatmapPage from '../pages/HeatmapPage';
import * as api from '../services/api';

vi.mock('../services/api', () => ({
  fetchTrackedPages: vi.fn(),
  fetchHeatmapData: vi.fn(),
}));

const mockTrackedPages = [
  { page_url: 'http://localhost:5173/demo', click_count: 15 },
  { page_url: 'http://localhost:5173/demo/pricing', click_count: 5 },
];

const mockHeatmapData = {
  page_url: 'http://localhost:5173/demo',
  total_clicks: 2,
  clicks: [
    { x: 200, y: 150, viewport: { width: 1440, height: 900 } },
    { x: 450, y: 320, viewport: { width: 1440, height: 900 } },
  ],
};

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('HeatmapPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(api.fetchTrackedPages).mockReturnValue(new Promise(() => {}));
    renderWithRouter(<HeatmapPage />);
    expect(screen.getByText('Loading tracked pages...')).toBeInTheDocument();
  });

  it('renders error state when fetching tracked pages fails', async () => {
    vi.mocked(api.fetchTrackedPages).mockRejectedValue(new Error('Failed to load tracked pages'));
    renderWithRouter(<HeatmapPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load tracked pages')).toBeInTheDocument();
    });
  });

  it('renders empty state when no tracked pages have clicks', async () => {
    vi.mocked(api.fetchTrackedPages).mockResolvedValue([]);
    renderWithRouter(<HeatmapPage />);

    await waitFor(() => {
      expect(screen.getByText('Select a page to view its heatmap')).toBeInTheDocument();
    });
  });

  it('renders page selector and displays heatmap upon selecting a page', async () => {
    vi.mocked(api.fetchTrackedPages).mockResolvedValue(mockTrackedPages);
    vi.mocked(api.fetchHeatmapData).mockResolvedValue(mockHeatmapData);

    renderWithRouter(<HeatmapPage />);

    await waitFor(() => {
      expect(screen.getByText('Click Heatmap')).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();

    fireEvent.change(select, { target: { value: 'http://localhost:5173/demo' } });

    await waitFor(() => {
      expect(api.fetchHeatmapData).toHaveBeenCalledWith('http://localhost:5173/demo');
      expect(screen.getByText(/recorded/i)).toBeInTheDocument();
    });
  });
});
