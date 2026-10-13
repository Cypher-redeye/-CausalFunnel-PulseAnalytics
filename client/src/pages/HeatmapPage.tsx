import { useState, useCallback, useRef, useEffect } from 'react';
import {
  MousePointerClick,
  ChevronDown,
  Crosshair,
  Info,
  Globe,
} from 'lucide-react';
import { fetchTrackedPages, fetchHeatmapData } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { LoadingState, ErrorState, EmptyState } from '../components/ui';
import type { HeatmapData } from '../types';

type HeatmapMode = 'composite' | 'density' | 'radar';

export default function HeatmapPage() {
  const [selectedUrl, setSelectedUrl] = useState<string>('');
  const [heatmapResult, setHeatmapResult] = useState<HeatmapData | null>(null);
  const [heatmapLoading, setHeatmapLoading] = useState(false);
  const [heatmapError, setHeatmapError] = useState<string | null>(null);
  const [mode, setMode] = useState<HeatmapMode>('composite');
  const [hoveredCoords, setHoveredCoords] = useState<{ x: number; y: number; docX: number; docY: number } | null>(null);
  const [nearestClick, setNearestClick] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const pagesFetcher = useCallback(() => fetchTrackedPages(), []);
  const { data: pages, loading, error, refetch } = useAsync(pagesFetcher, []);

  // Fetch heatmap data on page select
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

  // Canvas render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !heatmapResult) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, W, H);

    // 1. Draw realistic light browser webpage wireframe
    drawRealisticWebWireframe(ctx, W, H);

    const clicks = heatmapResult.clicks;
    if (clicks.length === 0) return;

    const refViewport = clicks.find((c) => c.viewport)?.viewport || {
      width: 1440,
      height: 900,
    };

    // 2. Draw density clouds if mode is 'composite' or 'density'
    if (mode === 'composite' || mode === 'density') {
      if (typeof ctx.save === 'function') ctx.save();
      ctx.globalCompositeOperation = 'multiply';

      clicks.forEach((click) => {
        const nx = (click.x / refViewport.width) * W;
        const ny = (click.y / refViewport.height) * H;
        const radius = 50;

        const grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, radius);
        grad.addColorStop(0, 'rgba(239, 68, 68, 0.7)');    // Hot crimson core
        grad.addColorStop(0.3, 'rgba(249, 115, 22, 0.55)'); // Terracotta
        grad.addColorStop(0.65, 'rgba(245, 158, 11, 0.35)'); // Amber mid
        grad.addColorStop(1, 'rgba(245, 158, 11, 0)');     // Transparent edge

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(nx, ny, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      if (typeof ctx.restore === 'function') ctx.restore();
    }

    // 3. Draw radar crosshairs & pinpoint dots if mode is 'composite' or 'radar'
    if (mode === 'composite' || mode === 'radar') {
      clicks.forEach((click, idx) => {
        const nx = (click.x / refViewport.width) * W;
        const ny = (click.y / refViewport.height) * H;

        // Outer marker ring
        ctx.beginPath();
        ctx.arc(nx, ny, 11, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Central click dot
        ctx.beginPath();
        ctx.arc(nx, ny, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Step number label pill
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText(`${idx + 1}`, nx + 8, ny - 6);
      });
    }
  }, [heatmapResult, mode]);

  // Handle canvas mouse hover for real-time coordinate inspection
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !heatmapResult) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasX = Math.round((e.clientX - rect.left) * scaleX);
    const canvasY = Math.round((e.clientY - rect.top) * scaleY);

    const refViewport = heatmapResult.clicks.find((c) => c.viewport)?.viewport || {
      width: 1440,
      height: 900,
    };

    const docX = Math.round((canvasX / canvas.width) * refViewport.width);
    const docY = Math.round((canvasY / canvas.height) * refViewport.height);

    setHoveredCoords({ x: canvasX, y: canvasY, docX, docY });

    // Find nearest click within 32px
    let found = null;
    let minDist = 32;
    heatmapResult.clicks.forEach((c) => {
      const nx = (c.x / refViewport.width) * canvas.width;
      const ny = (c.y / refViewport.height) * canvas.height;
      const dist = Math.hypot(nx - canvasX, ny - canvasY);
      if (dist < minDist) {
        minDist = dist;
        found = { x: c.x, y: c.y };
      }
    });
    setNearestClick(found);
  };

  const handleCanvasMouseLeave = () => {
    setHoveredCoords(null);
    setNearestClick(null);
  };

  if (loading) return <LoadingState message="Loading tracked pages..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      {/* Editorial Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900 font-display">
              Click Heatmap
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
              Interactive Visualizer
            </span>
          </div>
          <p className="text-xs text-stone-500">
            Visualize where visitors click on your website with normalized resolution coordinates.
          </p>
        </div>

        {/* View mode toggle switch */}
        <div className="flex items-center gap-1 p-1 rounded-xl border border-stone-200 bg-white shadow-xs">
          <button
            onClick={() => setMode('composite')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'composite'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Composite
          </button>
          <button
            onClick={() => setMode('density')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'density'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Density Heat
          </button>
          <button
            onClick={() => setMode('radar')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'radar'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Radar Scatter
          </button>
        </div>
      </div>

      {/* Page selector panel */}
      <div className="neutral-card p-5">
        <label className="block text-xs font-semibold text-stone-700 mb-2">
          Select Tracked Page URL
        </label>
        <div className="relative">
          <select
            value={selectedUrl}
            onChange={(e) => {
              const url = e.target.value;
              setSelectedUrl(url);
              if (!url) setHeatmapResult(null);
            }}
            className="w-full appearance-none bg-white border border-stone-200 rounded-xl px-4 py-2.5 pr-10 text-xs font-medium text-stone-900 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all cursor-pointer shadow-xs"
          >
            <option value="" className="text-stone-400">Choose a page URL...</option>
            {pages?.map((p) => (
              <option key={p.page_url} value={p.page_url} className="text-stone-900">
                {p.page_url} ({p.click_count} clicks)
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-stone-500 absolute right-3.5 top-3 pointer-events-none" />
        </div>
      </div>

      {/* Visualization Canvas Section */}
      {!selectedUrl ? (
        <div className="neutral-card p-10">
          <EmptyState
            title="Select a page to view its heatmap"
            description="Choose a tracked page URL from the dropdown above to render click density and coordinate scatter"
          />
        </div>
      ) : heatmapLoading ? (
        <LoadingState message="Loading heatmap data..." />
      ) : heatmapError ? (
        <ErrorState message={heatmapError} />
      ) : heatmapResult ? (
        <div className="neutral-card overflow-hidden">
          {/* Top canvas info bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 border-b border-stone-200 bg-stone-50/60">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 text-xs font-semibold text-stone-900">
                <MousePointerClick className="w-4 h-4 text-stone-600" />
                {heatmapResult.total_clicks} clicks recorded
              </span>
              <span className="text-stone-300">|</span>
              <span className="text-xs text-stone-500 truncate max-w-sm font-mono">
                {heatmapResult.page_url}
              </span>
            </div>

            {/* Heat gradient legend */}
            <div className="flex items-center gap-4 text-xs font-medium text-stone-600">
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-500">Activity Level:</span>
                <div className="h-2.5 w-24 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-600 shadow-xs" />
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <span>Low</span>
                <span>•</span>
                <span>Medium</span>
                <span>•</span>
                <span>High</span>
              </div>
            </div>
          </div>

          {/* Interactive Canvas container formatted like a sleek browser window */}
          <div className="p-6 bg-stone-100/60 flex flex-col items-center justify-center overflow-x-auto">
            {/* Browser window frame */}
            <div className="w-full max-w-[900px] rounded-2xl overflow-hidden border border-stone-200 bg-white shadow-md">
              {/* Browser chrome header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-100 bg-stone-50">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-stone-200 text-[11px] font-mono text-stone-500 max-w-xs truncate shadow-2xs">
                  <Globe className="w-3 h-3 text-stone-400" />
                  <span>{selectedUrl}</span>
                </div>
                <div className="w-8" />
              </div>

              {/* Canvas viewport */}
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={900}
                  height={600}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseLeave={handleCanvasMouseLeave}
                  className="cursor-crosshair block w-full bg-white"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />

                {/* Coordinate tooltip hover overlay */}
                {hoveredCoords && (
                  <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl border border-stone-200 bg-white/95 backdrop-blur-md text-xs font-medium text-stone-700 shadow-md pointer-events-none flex items-center gap-2.5">
                    <span className="flex items-center gap-1 text-stone-900 font-semibold">
                      <Crosshair className="w-3.5 h-3.5 text-stone-500" />
                      Position: ({hoveredCoords.docX}, {hoveredCoords.docY})
                    </span>
                    {nearestClick && (
                      <>
                        <span className="text-stone-300">|</span>
                        <span className="text-emerald-600 font-semibold">
                          Click Identified
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Informative description note */}
            <div className="mt-4 flex items-center gap-1.5 text-xs text-stone-500">
              <Info className="w-3.5 h-3.5 text-stone-400" />
              <span>Hover over any region of the webpage to inspect recorded click coordinates in real time.</span>
            </div>
          </div>

          {heatmapResult.total_clicks === 0 && (
            <div className="px-6 py-8 text-center border-t border-stone-100">
              <EmptyState
                title="No clicks recorded for this page"
                description="Interact with this URL on the demo site to generate heatmap scatter plots"
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Realistic, clean light browser webpage wireframe rendered to 2D canvas
 */
function drawRealisticWebWireframe(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Clean white base
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // --- Navbar ---
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, 54);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, w, 54);

  // Logo pill
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(28, 17, 20, 20);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('TechFlow', 56, 31);

  // Nav item links
  const navs = ['Features', 'Pricing', 'Testimonials', 'Docs'];
  navs.forEach((nav, i) => {
    ctx.fillStyle = '#64748b';
    ctx.font = '500 11px sans-serif';
    ctx.fillText(nav, 160 + i * 85, 31);
  });

  // Header button
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(w - 120, 15, 92, 24);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('Get Started', w - 105, 31);

  // --- Hero Section ---
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 54, w, 180);
  ctx.strokeStyle = '#f1f5f9';
  ctx.strokeRect(0, 54, w, 180);

  // Badge pill
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(w * 0.38, 76, w * 0.24, 20);
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 9px sans-serif';
  ctx.fillText('CLOUD INTELLIGENCE PLATFORM', w * 0.40, 89);

  // Hero headline placeholder
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(w * 0.24, 108, w * 0.52, 18);

  // Hero subtext
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(w * 0.3, 134, w * 0.4, 9);

  // Hero CTA buttons
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(w * 0.38, 158, w * 0.11, 32);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('Start Free', w * 0.40, 178);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(w * 0.51, 158, w * 0.11, 32);
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(w * 0.51, 158, w * 0.11, 32);
  ctx.fillStyle = '#475569';
  ctx.fillText('View Demo', w * 0.53, 178);

  // --- Search Bar Section ---
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(w * 0.22, 252, w * 0.56, 36);
  ctx.strokeStyle = '#e2e8f0';
  ctx.strokeRect(w * 0.22, 252, w * 0.56, 36);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px sans-serif';
  ctx.fillText('Search documentation, API endpoints, and guides...', w * 0.25, 274);

  // --- 3 Feature Cards ---
  const cardY = 308;
  const cardW = (w - 72) / 3;
  const cardH = 150;

  for (let i = 0; i < 3; i++) {
    const cx = 24 + i * (cardW + 12);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx, cardY, cardW, cardH);
    ctx.strokeStyle = '#e2e8f0';
    ctx.strokeRect(cx, cardY, cardW, cardH);

    // Icon square
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(cx + 16, cardY + 16, 30, 30);

    // Title bar
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(cx + 16, cardY + 58, cardW - 32, 12);

    // Text lines
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(cx + 16, cardY + 80, cardW - 32, 8);
    ctx.fillRect(cx + 16, cardY + 94, cardW - 55, 8);

    // Button link
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(cx + 16, cardY + 114, 76, 20);
    ctx.strokeStyle = '#e2e8f0';
    ctx.strokeRect(cx + 16, cardY + 114, 76, 20);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('Explore →', cx + 24, cardY + 127);
  }

  // --- Footer ---
  const footerY = h - 54;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, footerY, w, 54);
  ctx.strokeStyle = '#e2e8f0';
  ctx.strokeRect(0, footerY, w, 54);

  ctx.fillStyle = '#64748b';
  ctx.font = '11px sans-serif';
  ctx.fillText('© 2024 TechFlow Platform · Tracked with Pulse Analytics SDK', 24, footerY + 30);
  ctx.fillText('Privacy Policy · Terms · Docs', w - 180, footerY + 30);
}
