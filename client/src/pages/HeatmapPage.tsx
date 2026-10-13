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

    // 2. Draw density clouds if mode is 'composite' || 'density'
    if (mode === 'composite' || mode === 'density') {
      if (typeof ctx.save === 'function') ctx.save();
      ctx.globalCompositeOperation = 'multiply';

      clicks.forEach((click) => {
        const vp = (click.viewport && click.viewport.width && click.viewport.height)
          ? click.viewport
          : refViewport;
        const nx = (click.x / vp.width) * W;
        const ny = (click.y / vp.height) * H;
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

    // 3. Draw radar crosshairs & pinpoint dots if mode is 'composite' || 'radar'
    if (mode === 'composite' || mode === 'radar') {
      clicks.forEach((click, idx) => {
        const vp = (click.viewport && click.viewport.width && click.viewport.height)
          ? click.viewport
          : refViewport;
        const nx = (click.x / vp.width) * W;
        const ny = (click.y / vp.height) * H;

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
      const vp = (c.viewport && c.viewport.width && c.viewport.height)
        ? c.viewport
        : refViewport;
      const nx = (c.x / vp.width) * canvas.width;
      const ny = (c.y / vp.height) * canvas.height;
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
 * Realistic, clean light browser webpage wireframe rendered to 2D canvas.
 * Faithfully mirrors the TechFlow Cloud demo page elements and interactive hotspots.
 */
function drawRealisticWebWireframe(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Helper for rounded rectangles with fallback
  const roundRect = (x: number, y: number, rw: number, rh: number, r: number) => {
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, rw, rh, r);
    } else {
      ctx.rect(x, y, rw, rh);
    }
  };

  // 1. Clean white canvas background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // --- Sticky Telemetry Strip (Y: 0 to 26) ---
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, 26);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 26);
  ctx.lineTo(w, 26);
  ctx.stroke();

  // Green Tracker Active pill
  roundRect(24, 5, 84, 16, 8);
  ctx.fillStyle = '#ecfdf5';
  ctx.fill();
  ctx.strokeStyle = '#a7f3d0';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(33, 13, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#10b981';
  ctx.fill();

  ctx.fillStyle = '#047857';
  ctx.font = 'bold 8.5px sans-serif';
  ctx.fillText('Tracker Active', 40, 16);

  // Session indicator
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('|', 115, 16);
  ctx.fillStyle = '#64748b';
  ctx.font = '8.5px monospace';
  ctx.fillText('Session: d17ee26d-0f05...', 123, 16);

  // Top action buttons: Simulate Activity, Flush, Dashboard
  roundRect(w - 220, 5, 80, 16, 4);
  ctx.fillStyle = '#0f172a';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 8px sans-serif';
  ctx.fillText('Simulate Activity', w - 212, 16);

  roundRect(w - 134, 5, 46, 16, 4);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.stroke();
  ctx.fillStyle = '#475569';
  ctx.font = '8px sans-serif';
  ctx.fillText('Flush', w - 123, 16);

  roundRect(w - 82, 5, 58, 16, 4);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.stroke();
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 8px sans-serif';
  ctx.fillText('Dashboard ↗', w - 74, 16);

  // --- Main Navbar (Y: 26 to 76) ---
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 26, w, 50);
  ctx.strokeStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(0, 76);
  ctx.lineTo(w, 76);
  ctx.stroke();

  // Logo: TechFlow Cloud with dark rounded square
  roundRect(24, 38, 24, 24, 6);
  ctx.fillStyle = '#0f172a';
  ctx.fill();

  // Lightning bolt logo representation
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('⚡', 30, 55);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('TechFlow Cloud', 56, 54);

  // Navigation tabs: Features, Pricing, Reviews
  const navTabs = ['Features', 'Pricing', 'Reviews'];
  navTabs.forEach((tab, i) => {
    ctx.fillStyle = i === 0 ? '#0f172a' : '#64748b';
    ctx.font = i === 0 ? 'bold 11px sans-serif' : '500 11px sans-serif';
    ctx.fillText(tab, 210 + i * 80, 54);
  });

  // Right nav: Sign In & Get Started
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('Sign In', w - 146, 54);

  roundRect(w - 92, 38, 68, 24, 6);
  ctx.fillStyle = '#0f172a';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('Get Started', w - 82, 54);

  // --- Hero Section (Y: 76 to 350) ---
  ctx.fillStyle = '#fafaf9';
  ctx.fillRect(0, 76, w, 274);

  // Pill badge: Intelligent Cloud Platform & Analytics
  const badgeText = '✨ Intelligent Cloud Platform & Analytics';
  ctx.font = 'bold 9px sans-serif';
  const badgeW = ctx.measureText(badgeText).width + 24;
  roundRect(w / 2 - badgeW / 2, 92, badgeW, 18, 9);
  ctx.fillStyle = '#f1f5f9';
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.stroke();
  ctx.fillStyle = '#334155';
  ctx.fillText(badgeText, w / 2 - badgeW / 2 + 12, 105);

  // Headline H1: "Build Intelligent Applications at Global Scale"
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Build Intelligent Applications at Global Scale', w / 2, 134);

  // Subtitle
  ctx.fillStyle = '#64748b';
  ctx.font = '10px sans-serif';
  ctx.fillText('A developer platform combining high-performance compute, real-time edge persistence,', w / 2, 150);
  ctx.fillText('and automated telemetry tracking. Every interaction streams directly to Pulse Analytics.', w / 2, 163);
  ctx.textAlign = 'left'; // reset text alignment

  // Hero CTA Buttons
  // Button 1: Deploy Free Cluster ->
  const btn1W = 140;
  const btn1X = w / 2 - btn1W - 6;
  roundRect(btn1X, 178, btn1W, 26, 6);
  ctx.fillStyle = '#0f172a';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('Deploy Free Cluster →', btn1X + 16, 195);

  // Button 2: Explore Architecture
  const btn2W = 132;
  const btn2X = w / 2 + 6;
  roundRect(btn2X, 178, btn2W, 26, 6);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.stroke();
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('Explore Architecture', btn2X + 16, 195);

  // Code Terminal Window: pipeline.telemetry.ts
  const codeBoxW = 460;
  const codeBoxH = 92;
  const codeBoxX = w / 2 - codeBoxW / 2;
  const codeBoxY = 218;

  // Window frame
  roundRect(codeBoxX, codeBoxY, codeBoxW, codeBoxH, 8);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.stroke();

  // Window Titlebar
  roundRect(codeBoxX, codeBoxY, codeBoxW, 22, 8);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.stroke();

  // 3 macOS dots
  ctx.beginPath();
  ctx.arc(codeBoxX + 14, codeBoxY + 11, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = '#f87171';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(codeBoxX + 25, codeBoxY + 11, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = '#fbbf24';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(codeBoxX + 36, codeBoxY + 11, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = '#34d399';
  ctx.fill();

  ctx.fillStyle = '#64748b';
  ctx.font = '9px monospace';
  ctx.fillText('pipeline.telemetry.ts', codeBoxX + 48, codeBoxY + 14);

  // Code lines inside terminal
  ctx.font = '9px monospace';
  ctx.fillStyle = '#0f172a';
  ctx.fillText("import { createTracker } from '@pulse/tracker-sdk';", codeBoxX + 16, codeBoxY + 40);
  ctx.fillStyle = '#94a3b8';
  ctx.fillText("// Automatic session identification & click heatmap", codeBoxX + 16, codeBoxY + 54);
  ctx.fillStyle = '#0f172a';
  ctx.fillText("const analytics = createTracker({ batchSize: 5, intervalMs: 2000 });", codeBoxX + 16, codeBoxY + 68);
  ctx.fillText("analytics.observe(document.body);", codeBoxX + 16, codeBoxY + 82);

  // --- Search Input Box (Y: 360 to 395) ---
  const searchW = 460;
  const searchX = w / 2 - searchW / 2;
  const searchY = 328;
  roundRect(searchX, searchY, searchW, 30, 8);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  ctx.font = '9.5px sans-serif';
  ctx.fillText('🔍  Search API endpoints, functions, and documentation...', searchX + 14, searchY + 19);

  // --- 3 Feature Cards (Y: 375 to 545) ---
  const cardW = (w - 72) / 3;
  const cardH = 145;
  const cardY = 376;

  const cardTitles = [
    'Edge Compute Engine',
    'Real-time Telemetry',
    'Enterprise Guardrails',
  ];
  const cardDesc = [
    'Distributed V8 isolates executing at 300+ edge locations.',
    'Sub-millisecond event streaming and MongoDB pipeline.',
    'Automated rate-limiting, CORS validation, and health checks.',
  ];

  for (let i = 0; i < 3; i++) {
    const cx = 24 + i * (cardW + 12);
    roundRect(cx, cardY, cardW, cardH, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.stroke();

    // Icon square
    roundRect(cx + 14, cardY + 14, 24, 24, 6);
    ctx.fillStyle = '#f1f5f9';
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = '11px sans-serif';
    ctx.fillText(['⚡', '📊', '🛡️'][i], cx + 20, cardY + 30);

    // Title
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(cardTitles[i], cx + 14, cardY + 56);

    // Description lines
    ctx.fillStyle = '#64748b';
    ctx.font = '9px sans-serif';
    ctx.fillText(cardDesc[i], cx + 14, cardY + 74);

    // Button link
    roundRect(cx + 14, cardY + 104, 70, 20, 4);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 8.5px sans-serif';
    ctx.fillText('Explore →', cx + 20, cardY + 117);
  }

  // --- Footer (Y: 555 to 600) ---
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, h - 45, w, 45);
  ctx.strokeStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(0, h - 45);
  ctx.lineTo(w, h - 45);
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = '9.5px sans-serif';
  ctx.fillText('© 2026 TechFlow Cloud · Instrumented with Pulse Analytics SDK', 24, h - 20);
  ctx.fillText('Privacy Policy · Terms · Docs', w - 165, h - 20);
}
