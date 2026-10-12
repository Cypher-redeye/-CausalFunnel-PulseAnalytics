import { useState, useCallback, useRef, useEffect } from 'react';
import { MousePointerClick, ChevronDown } from 'lucide-react';
import { fetchTrackedPages, fetchHeatmapData } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { LoadingState, ErrorState, EmptyState } from '../components/ui';
import type { HeatmapData } from '../types';

export default function HeatmapPage() {
  const [selectedUrl, setSelectedUrl] = useState<string>('');
  const [heatmapResult, setHeatmapResult] = useState<HeatmapData | null>(null);
  const [heatmapLoading, setHeatmapLoading] = useState(false);
  const [heatmapError, setHeatmapError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const pagesFetcher = useCallback(() => fetchTrackedPages(), []);
  const { data: pages, loading, error, refetch } = useAsync(pagesFetcher, []);

  // Load heatmap data when URL selected
  useEffect(() => {
    if (!selectedUrl) return;

    setHeatmapLoading(true);
    setHeatmapError(null);

    fetchHeatmapData(selectedUrl)
      .then((result) => {
        setHeatmapResult(result);
        setHeatmapLoading(false);
      })
      .catch((err) => {
        setHeatmapError(err.message);
        setHeatmapLoading(false);
      });
  }, [selectedUrl]);

  // Draw heatmap on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !heatmapResult) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Draw page wireframe
    drawPageWireframe(ctx, W, H);

    // Draw click heatmap
    const clicks = heatmapResult.clicks;
    if (clicks.length === 0) return;

    // Determine reference viewport from data
    const refViewport = clicks.find((c) => c.viewport)?.viewport || {
      width: 1440,
      height: 900,
    };

    // Calculate density grid
    const gridSize = 20;
    const cols = Math.ceil(W / gridSize);
    const rows = Math.ceil(H / gridSize);
    const grid = new Array(cols * rows).fill(0);

    clicks.forEach((click) => {
      // Normalize coordinates to canvas
      const nx = (click.x / refViewport.width) * W;
      const ny = (click.y / refViewport.height) * H;

      const col = Math.min(Math.floor(nx / gridSize), cols - 1);
      const row = Math.min(Math.floor(ny / gridSize), rows - 1);
      if (col >= 0 && row >= 0) {
        grid[row * cols + col]++;
      }
    });

    const maxDensity = Math.max(...grid, 1);

    // Draw density cells
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const density = grid[r * cols + c];
        if (density === 0) continue;

        const intensity = density / maxDensity;
        ctx.fillStyle = getHeatColor(intensity);
        ctx.fillRect(c * gridSize, r * gridSize, gridSize, gridSize);
      }
    }

    // Draw individual dots on top
    clicks.forEach((click) => {
      const nx = (click.x / refViewport.width) * W;
      const ny = (click.y / refViewport.height) * H;

      ctx.beginPath();
      ctx.arc(nx, ny, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }, [heatmapResult]);

  if (loading) return <LoadingState message="Loading tracked pages..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Click Heatmap</h2>
        <p className="text-sm text-gray-500 mt-1">
          Visualize where users click on your pages
        </p>
      </div>

      {/* Page selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select a tracked page
        </label>
        <div className="relative">
          <select
            value={selectedUrl}
            onChange={(e) => {
              const url = e.target.value;
              setSelectedUrl(url);
              if (!url) setHeatmapResult(null);
            }}
            className="w-full appearance-none bg-gray-50 border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Choose a page URL...</option>
            {pages?.map((p) => (
              <option key={p.page_url} value={p.page_url}>
                {p.page_url} ({p.click_count} clicks)
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
        </div>
      </div>

      {/* Heatmap visualization */}
      {!selectedUrl ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <EmptyState
            title="Select a page to view its heatmap"
            description="Choose a tracked page URL from the dropdown above"
          />
        </div>
      ) : heatmapLoading ? (
        <LoadingState message="Loading heatmap data..." />
      ) : heatmapError ? (
        <ErrorState message={heatmapError} />
      ) : heatmapResult ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <MousePointerClick className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                {heatmapResult.total_clicks} click{heatmapResult.total_clicks !== 1 ? 's' : ''} recorded
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-blue-200" />
                Low
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-yellow-400" />
                Medium
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-red-500" />
                High
              </div>
            </div>
          </div>
          <div className="p-4 bg-gray-50 flex justify-center">
            <canvas
              ref={canvasRef}
              width={900}
              height={600}
              className="border border-gray-200 rounded-lg bg-white shadow-inner max-w-full"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
          {heatmapResult.total_clicks === 0 && (
            <div className="px-5 py-4 text-center">
              <EmptyState title="No clicks recorded for this page" />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function getHeatColor(intensity: number): string {
  // Blue → Green → Yellow → Red
  if (intensity < 0.25) {
    return `rgba(59, 130, 246, ${0.1 + intensity * 1.2})`;
  }
  if (intensity < 0.5) {
    return `rgba(34, 197, 94, ${0.15 + intensity * 0.8})`;
  }
  if (intensity < 0.75) {
    return `rgba(250, 204, 21, ${0.2 + intensity * 0.6})`;
  }
  return `rgba(239, 68, 68, ${0.3 + intensity * 0.5})`;
}

function drawPageWireframe(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;

  // Header bar
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, w, 56);
  ctx.strokeRect(0, 0, w, 56);

  // Logo placeholder
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(20, 16, 100, 24);

  // Nav items
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(200 + i * 80, 20, 60, 16);
  }

  // CTA button in header
  ctx.fillStyle = '#dbeafe';
  ctx.fillRect(w - 140, 14, 120, 28);

  // Hero section
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 56, w, 180);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(w * 0.15, 90, w * 0.7, 24);
  ctx.fillRect(w * 0.25, 126, w * 0.5, 16);

  // CTA button
  ctx.fillStyle = '#bfdbfe';
  ctx.fillRect(w * 0.35, 160, w * 0.15, 36);
  ctx.fillStyle = '#93c5fd';
  ctx.fillRect(w * 0.52, 160, w * 0.15, 36);

  // Content cards
  const cardY = 260;
  const cardW = (w - 80) / 3;
  for (let i = 0; i < 3; i++) {
    const x = 20 + i * (cardW + 20);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(x, cardY, cardW, 160);
    ctx.strokeRect(x, cardY, cardW, 160);

    // Card image
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(x + 12, cardY + 12, cardW - 24, 60);

    // Card text lines
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(x + 12, cardY + 84, cardW - 24, 12);
    ctx.fillRect(x + 12, cardY + 104, cardW * 0.5, 10);

    // Card button
    ctx.fillStyle = '#dbeafe';
    ctx.fillRect(x + 12, cardY + 128, 80, 24);
  }

  // Search field area
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(20, 450, w - 40, 40);
  ctx.strokeRect(20, 450, w - 40, 40);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(32, 462, 120, 16);

  // Footer
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, h - 60, w, 60);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(20, h - 40, 150, 12);
  ctx.fillRect(w - 170, h - 40, 150, 12);
}
