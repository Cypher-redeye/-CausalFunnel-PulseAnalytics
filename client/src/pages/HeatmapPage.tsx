import { useState, useCallback, useRef, useEffect } from 'react';
import {
  MousePointerClick,
  ChevronDown,
  Crosshair,
  Info,
  Sparkles,
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
  const [nearestClick, setNearestClick] = useState<{ x: number; y: number; count?: number } | null>(null);
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

    // 1. Draw architectural blueprint wireframe preview of the page
    drawArchitecturalWireframe(ctx, W, H);

    const clicks = heatmapResult.clicks;
    if (clicks.length === 0) return;

    const refViewport = clicks.find((c) => c.viewport)?.viewport || {
      width: 1440,
      height: 900,
    };

    // 2. Draw density clouds if mode is 'composite' or 'density'
    if (mode === 'composite' || mode === 'density') {
      if (typeof ctx.save === 'function') ctx.save();
      // Use 'screen' blending for natural luminous heat accumulation
      ctx.globalCompositeOperation = 'screen';

      clicks.forEach((click) => {
        const nx = (click.x / refViewport.width) * W;
        const ny = (click.y / refViewport.height) * H;
        const radius = 48; // Generous radiant glow

        const grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, radius);
        grad.addColorStop(0, 'rgba(239, 68, 68, 0.7)');    // Red core
        grad.addColorStop(0.35, 'rgba(245, 158, 11, 0.45)'); // Amber mid
        grad.addColorStop(0.7, 'rgba(59, 130, 246, 0.25)'); // Cyan/blue outer
        grad.addColorStop(1, 'rgba(59, 130, 246, 0)');     // Transparent edge

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

        // Outer pulsing ring
        ctx.beginPath();
        ctx.arc(nx, ny, 10, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Target crosshair ticks
        if (typeof ctx.moveTo === 'function' && typeof ctx.lineTo === 'function') {
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(nx - 6, ny);
          ctx.lineTo(nx + 6, ny);
          ctx.moveTo(nx, ny - 6);
          ctx.lineTo(nx, ny + 6);
          ctx.stroke();
        }

        // Central solid ping
        ctx.beginPath();
        ctx.arc(nx, ny, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Optional tiny coordinate index label
        ctx.font = '9px monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText(`#${idx + 1}`, nx + 6, ny - 6);
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

    // Find nearest click within 25px
    let found = null;
    let minDist = 30;
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
      {/* Header telemetry bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Crosshair className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold tracking-tight text-white">Click Heatmap</h2>
            <span className="px-2 py-0.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-[10px] font-mono text-blue-400">
              Instrument Grade
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Spatial distribution of user click coordinates mapped over page blueprint wireframes
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg border border-slate-800 bg-slate-900/80">
          <button
            onClick={() => setMode('composite')}
            className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
              mode === 'composite'
                ? 'bg-blue-600 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Composite
          </button>
          <button
            onClick={() => setMode('density')}
            className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
              mode === 'density'
                ? 'bg-blue-600 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Density Heat
          </button>
          <button
            onClick={() => setMode('radar')}
            className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
              mode === 'radar'
                ? 'bg-blue-600 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Radar Scatter
          </button>
        </div>
      </div>

      {/* Page selector panel */}
      <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 backdrop-blur-md p-5 shadow-lg shadow-black/20">
        <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-2">
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
            className="w-full appearance-none bg-slate-950/70 border border-slate-800 rounded-lg px-4 py-2.5 pr-10 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/80 transition-all cursor-pointer"
          >
            <option value="" className="bg-slate-900 text-slate-400">Choose a page URL...</option>
            {pages?.map((p) => (
              <option key={p.page_url} value={p.page_url} className="bg-slate-900 text-slate-200">
                {p.page_url} ({p.click_count} clicks)
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
        </div>
      </div>

      {/* Visualization Canvas Section */}
      {!selectedUrl ? (
        <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 backdrop-blur-md p-6">
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
        <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 backdrop-blur-md shadow-xl shadow-black/30 overflow-hidden">
          {/* Top canvas instrument bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-800/80 bg-slate-950/50">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-medium">
                <MousePointerClick className="w-4 h-4 text-emerald-400" />
                {heatmapResult.total_clicks} clicks recorded
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-[11px] font-mono text-slate-400 truncate max-w-xs">
                {heatmapResult.page_url}
              </span>
            </div>

            {/* Heat gradient legend */}
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Density:</span>
                <div className="h-2 w-24 rounded-full bg-gradient-to-r from-blue-500 via-yellow-400 to-red-500" />
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span className="text-blue-400">Low</span>
                <span className="text-yellow-400">Medium</span>
                <span className="text-red-400">High</span>
              </div>
            </div>
          </div>

          {/* Interactive Canvas container */}
          <div className="relative p-6 bg-[#080a0f] flex flex-col items-center justify-center overflow-x-auto">
            <div className="relative rounded-lg overflow-hidden border border-slate-800 shadow-2xl">
              <canvas
                ref={canvasRef}
                width={900}
                height={600}
                onMouseMove={handleCanvasMouseMove}
                onMouseLeave={handleCanvasMouseLeave}
                className="cursor-crosshair block bg-[#0c1017]"
                style={{ maxWidth: '100%', height: 'auto' }}
              />

              {/* Live coordinate inspector HUD overlay */}
              {hoveredCoords && (
                <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950/90 backdrop-blur-md text-[11px] font-mono text-slate-300 shadow-lg pointer-events-none flex items-center gap-3">
                  <span className="flex items-center gap-1 text-blue-400">
                    <Crosshair className="w-3 h-3" />
                    Canvas: ({hoveredCoords.x}, {hoveredCoords.y})
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="text-emerald-400 font-medium">
                    Doc: ({hoveredCoords.docX}, {hoveredCoords.docY})
                  </span>
                  {nearestClick && (
                    <>
                      <span className="text-slate-600">|</span>
                      <span className="text-red-400 font-semibold flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        Target Hit!
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Heatmap notice */}
            <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Blueprint wireframe maps click coordinates against responsive document coordinates. Hover over canvas to inspect.</span>
            </div>
          </div>

          {heatmapResult.total_clicks === 0 && (
            <div className="px-5 py-6 text-center border-t border-slate-800">
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
 * Renders a high-craft architectural blueprint schematic of the tracked page
 * into the 2D canvas context.
 */
function drawArchitecturalWireframe(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Deep blueprint base
  ctx.fillStyle = '#0a0d14';
  ctx.fillRect(0, 0, w, h);

  // Subtle architectural grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;
  const gridSize = 30;
  if (typeof ctx.moveTo === 'function' && typeof ctx.lineTo === 'function') {
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  // --- Header / Navbar Wireframe ---
  ctx.fillStyle = '#0f141f';
  ctx.fillRect(0, 0, w, 52);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, w, 52);

  // Logo pill
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(24, 16, 20, 20);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('TechFlow', 52, 30);

  // Nav item links
  const navs = ['Features', 'Pricing', 'Reviews', 'Docs'];
  navs.forEach((nav, i) => {
    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.fillText(nav, 150 + i * 75, 30);
  });

  // CTA button in header
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(w - 120, 14, 96, 24);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('Get Started', w - 104, 30);

  // --- Hero Section Wireframe ---
  ctx.fillStyle = '#0d111a';
  ctx.fillRect(0, 52, w, 175);
  ctx.strokeStyle = '#1e293b';
  ctx.strokeRect(0, 52, w, 175);

  // Hero pill tag
  ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
  ctx.fillRect(w * 0.38, 72, w * 0.24, 20);
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
  ctx.strokeRect(w * 0.38, 72, w * 0.24, 20);
  ctx.fillStyle = '#60a5fa';
  ctx.font = '9px monospace';
  ctx.fillText('NEXT-GEN CLOUD PLATFORM', w * 0.40, 85);

  // Hero headline placeholder
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(w * 0.22, 104, w * 0.56, 18);

  // Hero subtext line
  ctx.fillStyle = '#475569';
  ctx.fillRect(w * 0.28, 130, w * 0.44, 10);

  // Hero primary & secondary buttons
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(w * 0.38, 156, w * 0.11, 32);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('Free Trial', w * 0.40, 175);

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(w * 0.51, 156, w * 0.11, 32);
  ctx.strokeStyle = '#334155';
  ctx.strokeRect(w * 0.51, 156, w * 0.11, 32);
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Watch Demo', w * 0.53, 175);

  // --- Search Bar Section Wireframe ---
  ctx.fillStyle = '#0d111a';
  ctx.fillRect(w * 0.2, 240, w * 0.6, 36);
  ctx.strokeStyle = '#1e293b';
  ctx.strokeRect(w * 0.2, 240, w * 0.6, 36);
  ctx.fillStyle = '#475569';
  ctx.font = '10px monospace';
  ctx.fillText('Search documentation, API, and tutorials...', w * 0.23, 262);

  // --- 3 Feature Cards Grid Wireframe ---
  const cardY = 295;
  const cardW = (w - 72) / 3;
  const cardH = 160;

  for (let i = 0; i < 3; i++) {
    const cx = 24 + i * (cardW + 12);

    ctx.fillStyle = '#0e131e';
    ctx.fillRect(cx, cardY, cardW, cardH);
    ctx.strokeStyle = '#1e293b';
    ctx.strokeRect(cx, cardY, cardW, cardH);

    // Card icon box
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(cx + 16, cardY + 16, 32, 32);

    // Card title
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(cx + 16, cardY + 60, cardW - 32, 12);

    // Card description lines
    ctx.fillStyle = '#334155';
    ctx.fillRect(cx + 16, cardY + 84, cardW - 32, 8);
    ctx.fillRect(cx + 16, cardY + 98, cardW - 60, 8);

    // Card link button
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.fillRect(cx + 16, cardY + 120, 80, 20);
    ctx.fillStyle = '#60a5fa';
    ctx.font = '9px monospace';
    ctx.fillText('Learn More →', cx + 24, cardY + 133);
  }

  // --- Footer Wireframe ---
  const footerY = h - 55;
  ctx.fillStyle = '#090b10';
  ctx.fillRect(0, footerY, w, 55);
  ctx.strokeStyle = '#1e293b';
  ctx.strokeRect(0, footerY, w, 55);

  ctx.fillStyle = '#475569';
  ctx.font = '10px monospace';
  ctx.fillText('© 2024 TechFlow Platform · Tracked with Pulse Analytics SDK', 24, footerY + 30);
  ctx.fillText('Privacy · Terms · Status', w - 180, footerY + 30);
}
