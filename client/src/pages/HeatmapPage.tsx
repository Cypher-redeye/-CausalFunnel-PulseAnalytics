import { useState, useCallback, useRef, useEffect } from 'react';
import {
  MousePointerClick,
  ChevronDown,
  Crosshair,
  Info,
  Zap,
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
      ctx.globalCompositeOperation = 'screen';

      clicks.forEach((click) => {
        const nx = (click.x / refViewport.width) * W;
        const ny = (click.y / refViewport.height) * H;
        const radius = 54; // Generous radiant glow

        const grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, radius);
        grad.addColorStop(0, 'rgba(254, 243, 199, 0.95)');   // White-hot champagne core
        grad.addColorStop(0.25, 'rgba(245, 158, 11, 0.85)'); // Radiant Amber mid
        grad.addColorStop(0.55, 'rgba(234, 88, 12, 0.6)');   // Sunset Terracotta ring
        grad.addColorStop(0.8, 'rgba(225, 29, 72, 0.3)');    // Warm Crimson halo
        grad.addColorStop(1, 'rgba(225, 29, 72, 0)');        // Transparent edge

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

        // Outer neon target ring
        ctx.beginPath();
        ctx.arc(nx, ny, 12, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Target crosshair ticks
        if (typeof ctx.moveTo === 'function' && typeof ctx.lineTo === 'function') {
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(nx - 7, ny);
          ctx.lineTo(nx + 7, ny);
          ctx.moveTo(nx, ny - 7);
          ctx.lineTo(nx, ny + 7);
          ctx.stroke();
        }

        // Central solid ping
        ctx.beginPath();
        ctx.arc(nx, ny, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label
        ctx.font = '9px monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillText(`#${idx + 1}`, nx + 7, ny - 7);
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

    // Find nearest click within 30px
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
    <div className="space-y-6 relative">
      {/* Editorial Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Crosshair className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white font-display text-gradient-silver">
              Click Heatmap
            </h2>
            <span className="px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-[10px] font-mono text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              [ SIGNATURE INSTRUMENT ]
            </span>
          </div>
          <p className="text-xs font-mono text-stone-400">
            Spatial FLIR thermal density and coordinate telemetry mapped over responsive blueprints
          </p>
        </div>

        {/* View mode toggle switch */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl border border-stone-800 bg-stone-900/80 backdrop-blur-xl shadow-sm">
          <button
            onClick={() => setMode('composite')}
            className={`px-3 py-1.5 text-xs font-mono rounded-xl transition-all ${
              mode === 'composite'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 font-bold shadow-[0_0_15px_rgba(245,158,11,0.35)]'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Composite
          </button>
          <button
            onClick={() => setMode('density')}
            className={`px-3 py-1.5 text-xs font-mono rounded-xl transition-all ${
              mode === 'density'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 font-bold shadow-[0_0_15px_rgba(245,158,11,0.35)]'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Density Heat
          </button>
          <button
            onClick={() => setMode('radar')}
            className={`px-3 py-1.5 text-xs font-mono rounded-xl transition-all ${
              mode === 'radar'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 font-bold shadow-[0_0_15px_rgba(245,158,11,0.35)]'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Radar Scatter
          </button>
        </div>
      </div>

      {/* Page selector panel */}
      <div className="rounded-2xl border border-stone-800/80 bg-stone-900/60 backdrop-blur-xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <label className="block text-xs font-mono font-medium uppercase tracking-widest text-stone-400 mb-2.5">
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
            className="w-full appearance-none bg-stone-900/90 border border-stone-800 rounded-xl px-4 py-3 pr-10 text-xs font-mono text-stone-200 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition-all cursor-pointer shadow-inner"
          >
            <option value="" className="bg-stone-900 text-stone-400">Choose a page URL...</option>
            {pages?.map((p) => (
              <option key={p.page_url} value={p.page_url} className="bg-stone-900 text-stone-200">
                {p.page_url} ({p.click_count} clicks)
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-amber-400 absolute right-3.5 top-3.5 pointer-events-none" />
        </div>
      </div>

      {/* Visualization Canvas Section */}
      {!selectedUrl ? (
        <div className="rounded-2xl border border-stone-800/80 bg-stone-900/60 backdrop-blur-xl p-8">
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
        <div className="rounded-2xl border border-stone-800/80 bg-stone-900/60 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.7)] overflow-hidden relative">
          {/* Top canvas instrument bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 border-b border-stone-800 bg-white/[0.01]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold">
                <MousePointerClick className="w-4 h-4 text-amber-400" />
                {heatmapResult.total_clicks} clicks recorded
              </span>
              <span className="text-stone-600">|</span>
              <span className="text-[11px] font-mono text-stone-400 truncate max-w-sm">
                {heatmapResult.page_url}
              </span>
            </div>

            {/* Heat gradient legend */}
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-stone-400">Thermal FLIR:</span>
                <div className="h-2.5 w-28 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 via-rose-500 to-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.3)]" />
              </div>
              <div className="flex items-center gap-2 text-[10px] text-stone-400">
                <span className="text-amber-400 font-bold">Low</span>
                <span className="text-orange-400 font-bold">Medium</span>
                <span className="text-rose-400 font-bold">High</span>
              </div>
            </div>
          </div>

          {/* Interactive Canvas container with Aerospace HUD styling */}
          <div className="relative p-6 bg-[#0c0a09] flex flex-col items-center justify-center overflow-x-auto">
            <div className="relative rounded-xl overflow-hidden border border-stone-800 shadow-[0_0_50px_rgba(0,0,0,0.9)]">
              <canvas
                ref={canvasRef}
                width={900}
                height={600}
                onMouseMove={handleCanvasMouseMove}
                onMouseLeave={handleCanvasMouseLeave}
                className="cursor-crosshair block bg-[#141210]"
                style={{ maxWidth: '100%', height: 'auto' }}
              />

              {/* Live coordinate inspector HUD overlay */}
              {hoveredCoords && (
                <div className="absolute bottom-4 left-4 px-3.5 py-2 rounded-xl border border-amber-500/30 bg-stone-950/95 backdrop-blur-xl text-[11px] font-mono text-stone-300 shadow-[0_0_20px_rgba(245,158,11,0.25)] pointer-events-none flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                    <Crosshair className="w-3.5 h-3.5" />
                    Canvas: ({hoveredCoords.x}, {hoveredCoords.y})
                  </span>
                  <span className="text-stone-600">|</span>
                  <span className="text-orange-400 font-bold">
                    Doc: ({hoveredCoords.docX}, {hoveredCoords.docY})
                  </span>
                  {nearestClick && (
                    <>
                      <span className="text-stone-600">|</span>
                      <span className="text-rose-400 font-bold flex items-center gap-1 animate-pulse">
                        <Zap className="w-3 h-3" />
                        Target Locked
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Heatmap notice */}
            <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-stone-400">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>Blueprint maps click coordinates with responsive normalization. Hover to inspect live target telemetry.</span>
            </div>
          </div>

          {heatmapResult.total_clicks === 0 && (
            <div className="px-6 py-8 text-center border-t border-stone-800">
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
 * Architectural blueprint wireframe rendered to 2D canvas (Warm Obsidian & Amber Style)
 */
function drawArchitecturalWireframe(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Deep warm blueprint base
  ctx.fillStyle = '#141210';
  ctx.fillRect(0, 0, w, h);

  // Subtle architectural grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
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
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(0, 0, w, 52);
  ctx.strokeStyle = '#292524';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, w, 52);

  // Logo pill
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(24, 16, 20, 20);
  ctx.fillStyle = '#f5f5f4';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('TechFlow', 52, 30);

  // Nav item links
  const navs = ['Features', 'Pricing', 'Reviews', 'Docs'];
  navs.forEach((nav, i) => {
    ctx.fillStyle = '#78716c';
    ctx.font = '10px monospace';
    ctx.fillText(nav, 150 + i * 75, 30);
  });

  // CTA button in header
  ctx.fillStyle = '#ea580c';
  ctx.fillRect(w - 120, 14, 96, 24);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('Get Started', w - 104, 30);

  // --- Hero Section Wireframe ---
  ctx.fillStyle = '#181614';
  ctx.fillRect(0, 52, w, 175);
  ctx.strokeStyle = '#292524';
  ctx.strokeRect(0, 52, w, 175);

  // Hero pill tag
  ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
  ctx.fillRect(w * 0.38, 72, w * 0.24, 20);
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
  ctx.strokeRect(w * 0.38, 72, w * 0.24, 20);
  ctx.fillStyle = '#f59e0b';
  ctx.font = '9px monospace';
  ctx.fillText('NEXT-GEN CLOUD PLATFORM', w * 0.40, 85);

  // Hero headline placeholder
  ctx.fillStyle = '#f5f5f4';
  ctx.fillRect(w * 0.22, 104, w * 0.56, 18);

  // Hero subtext line
  ctx.fillStyle = '#78716c';
  ctx.fillRect(w * 0.28, 130, w * 0.44, 10);

  // Hero primary & secondary buttons
  ctx.fillStyle = '#ea580c';
  ctx.fillRect(w * 0.38, 156, w * 0.11, 32);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('Free Trial', w * 0.40, 175);

  ctx.fillStyle = '#292524';
  ctx.fillRect(w * 0.51, 156, w * 0.11, 32);
  ctx.strokeStyle = '#44403c';
  ctx.strokeRect(w * 0.51, 156, w * 0.11, 32);
  ctx.fillStyle = '#a8a29e';
  ctx.fillText('Watch Demo', w * 0.53, 175);

  // --- Search Bar Section Wireframe ---
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(w * 0.2, 240, w * 0.6, 36);
  ctx.strokeStyle = '#292524';
  ctx.strokeRect(w * 0.2, 240, w * 0.6, 36);
  ctx.fillStyle = '#78716c';
  ctx.font = '10px monospace';
  ctx.fillText('Search documentation, API, and tutorials...', w * 0.23, 262);

  // --- 3 Feature Cards Grid Wireframe ---
  const cardY = 295;
  const cardW = (w - 72) / 3;
  const cardH = 160;

  for (let i = 0; i < 3; i++) {
    const cx = 24 + i * (cardW + 12);

    ctx.fillStyle = '#1c1917';
    ctx.fillRect(cx, cardY, cardW, cardH);
    ctx.strokeStyle = '#292524';
    ctx.strokeRect(cx, cardY, cardW, cardH);

    // Card icon box
    ctx.fillStyle = '#292524';
    ctx.fillRect(cx + 16, cardY + 16, 32, 32);

    // Card title
    ctx.fillStyle = '#e7e5e4';
    ctx.fillRect(cx + 16, cardY + 60, cardW - 32, 12);

    // Card description lines
    ctx.fillStyle = '#44403c';
    ctx.fillRect(cx + 16, cardY + 84, cardW - 32, 8);
    ctx.fillRect(cx + 16, cardY + 98, cardW - 60, 8);

    // Card link button
    ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
    ctx.fillRect(cx + 16, cardY + 120, 80, 20);
    ctx.fillStyle = '#f59e0b';
    ctx.font = '9px monospace';
    ctx.fillText('Learn More →', cx + 24, cardY + 133);
  }

  // --- Footer Wireframe ---
  const footerY = h - 55;
  ctx.fillStyle = '#141210';
  ctx.fillRect(0, footerY, w, 55);
  ctx.strokeStyle = '#292524';
  ctx.strokeRect(0, footerY, w, 55);

  ctx.fillStyle = '#78716c';
  ctx.font = '10px monospace';
  ctx.fillText('© 2024 TechFlow Platform · Tracked with Pulse Analytics SDK', 24, footerY + 30);
  ctx.fillText('Privacy · Terms · Status', w - 180, footerY + 30);
}
