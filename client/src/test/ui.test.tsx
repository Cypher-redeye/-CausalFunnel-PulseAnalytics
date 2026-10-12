import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoadingState, ErrorState, EmptyState, StatCard } from '../components/ui';
import { Activity } from 'lucide-react';

describe('UI Components', () => {
  describe('LoadingState', () => {
    it('renders default loading message', () => {
      render(<LoadingState />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders custom loading message', () => {
      render(<LoadingState message="Fetching analytics data..." />);
      expect(screen.getByText('Fetching analytics data...')).toBeInTheDocument();
    });
  });

  describe('ErrorState', () => {
    it('renders error message', () => {
      render(<ErrorState message="Network connection failed" />);
      expect(screen.getByText('Network connection failed')).toBeInTheDocument();
    });

    it('renders retry button and triggers callback when clicked', () => {
      const handleRetry = vi.fn();
      render(<ErrorState message="Failed to load" onRetry={handleRetry} />);
      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();
      fireEvent.click(retryButton);
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it('does not render retry button if onRetry is not provided', () => {
      render(<ErrorState message="Permanent error" />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('EmptyState', () => {
    it('renders title and description', () => {
      render(
        <EmptyState
          title="No sessions found"
          description="Visit the demo website to generate analytics data"
        />
      );
      expect(screen.getByText('No sessions found')).toBeInTheDocument();
      expect(
        screen.getByText('Visit the demo website to generate analytics data')
      ).toBeInTheDocument();
    });
  });

  describe('StatCard', () => {
    it('renders label and formatted value', () => {
      render(
        <StatCard
          label="Total Sessions"
          value="1,248"
          icon={<Activity data-testid="icon" />}
          color="bg-blue-50 text-blue-600"
        />
      );
      expect(screen.getByText('Total Sessions')).toBeInTheDocument();
      expect(screen.getByText('1,248')).toBeInTheDocument();
    });
  });
});
