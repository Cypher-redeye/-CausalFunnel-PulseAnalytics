import { useState, useEffect } from 'react';
import {
  Search,
  Star,
  ArrowRight,
  ChevronRight,
  Zap,
  Shield,
  BarChart3,
  Globe,
  ExternalLink,
  Play,
  RotateCw,
  Terminal,
  Cpu,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

declare global {
  interface Window {
    PulseTracker?: {
      getSessionId: () => string;
      trackPageView: (url?: string) => void;
      trackClick: (x: number, y: number, extra?: Record<string, unknown>) => void;
      flush: () => void;
      getQueueLength: () => number;
      getTotalSent: () => number;
    };
  }
}

/**
 * Awwwards Site of the Day inspired Developer Cloud Landing Page ("TechFlow Cloud").
 * Real-time event tracking via Pulse Analytics SDK.
 * All clicks and navigation generate genuine events recorded into MongoDB.
 */
export default function DemoPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'features' | 'pricing' | 'reviews'>('features');
  const [sessionId] = useState<string>(() => {
    if (typeof window === 'undefined') return 'initializing...';
    return (
      (window.PulseTracker && window.PulseTracker.getSessionId()) ||
      sessionStorage.getItem('pulse_session_id') ||
      'active-session'
    );
  });
  const [clickCount, setClickCount] = useState<number>(0);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const onDocClick = () => {
      setClickCount((c) => c + 1);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const handleTabChange = (tab: 'features' | 'pricing' | 'reviews') => {
    setActiveTab(tab);
    window.location.hash = tab;
    if (window.PulseTracker) {
      window.PulseTracker.trackPageView(window.location.href);
    }
  };

  const handleGenerateDemoActivity = async () => {
    if (simulating) return;
    setSimulating(true);
    setNotification('Simulating realistic user interaction trajectory across page elements...');

    const clickableElements = document.querySelectorAll(
      '[data-demo-interactive="true"]'
    );

    if (clickableElements.length === 0) {
      setSimulating(false);
      return;
    }

    const count = Math.min(6, clickableElements.length);
    for (let i = 0; i < count; i++) {
      const el = clickableElements[i % clickableElements.length] as HTMLElement;
      const rect = el.getBoundingClientRect();
      const clickX = Math.round(rect.left + rect.width / 2 + (Math.random() * 20 - 10));
      const clickY = Math.round(rect.top + window.scrollY + rect.height / 2 + (Math.random() * 10 - 5));

      if (window.PulseTracker) {
        window.PulseTracker.trackClick(clickX, clickY, { is_demo: true });
      }
      setClickCount((c) => c + 1);
      await new Promise((r) => setTimeout(r, 380));
    }

    if (window.PulseTracker) {
      window.PulseTracker.flush();
    }

    setSimulating(false);
    setNotification('✅ Generated 6 realistic click events and flushed queue to backend API!');
    setTimeout(() => setNotification(null), 4000);
  };

  const handleManualFlush = () => {
    if (window.PulseTracker) {
      window.PulseTracker.flush();
      setNotification('Flushed event buffer to server');
      setTimeout(() => setNotification(null), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0a09] text-stone-200 antialiased font-sans relative overflow-x-hidden selection:bg-amber-500/30 selection:text-white" data-demo-page="true">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 bg-aurora-glow pointer-events-none z-0" />
      <div className="fixed inset-0 bg-grid-cyber opacity-60 pointer-events-none z-0" />

      {/* Awwwards Telemetry HUD Strip */}
      <div className="bg-[#141210]/90 backdrop-blur-2xl text-stone-200 text-xs py-2.5 px-4 sticky top-0 z-50 border-b border-stone-800 shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 font-mono text-[11px] font-bold text-emerald-400 bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Tracker Active
            </span>
            <span className="text-stone-600 hidden sm:inline">|</span>
            <span className="font-mono text-stone-300 text-xs">
              Session: <span className="text-white font-bold">{sessionId.substring(0, 18)}...</span>
            </span>
            <span className="text-stone-600 hidden md:inline">|</span>
            <span className="text-stone-400 text-xs hidden md:inline font-mono">
              Clicks: <span className="font-bold text-amber-400">{clickCount}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateDemoActivity}
              disabled={simulating}
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-stone-950 font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(245,158,11,0.35)]"
              title="Automatically simulate realistic user clicks"
            >
              <Play className="w-3 h-3" />
              {simulating ? 'Simulating...' : 'Simulate Activity'}
            </button>
            <button
              onClick={handleManualFlush}
              className="inline-flex items-center gap-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs px-3 py-1.5 rounded-xl border border-stone-700 transition-colors"
              title="Flush event queue to API immediately"
            >
              <RotateCw className="w-3 h-3" />
              Flush
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)]"
            >
              Dashboard <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {notification && (
        <div className="bg-amber-950/80 border-b border-amber-500/30 text-amber-300 text-center text-xs py-2 px-4 animate-fade-in font-mono relative z-50">
          {notification}
        </div>
      )}

      {/* Luxury Awwwards Navigation Header */}
      <header className="border-b border-stone-800 bg-[#141210]/80 backdrop-blur-2xl relative z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div
              className="flex items-center gap-2.5 text-white font-extrabold tracking-tight cursor-pointer font-display"
              data-demo-interactive="true"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-stone-950 shadow-[0_0_15px_rgba(245,158,11,0.35)]">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-base tracking-tight font-display">TechFlow Cloud</span>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => handleTabChange('features')}
                className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition-all font-display ${
                  activeTab === 'features'
                    ? 'text-white bg-white/[0.08] border border-white/15 shadow-sm'
                    : 'text-stone-400 hover:text-white hover:bg-white/[0.04]'
                }`}
                data-demo-interactive="true"
              >
                Features
              </button>
              <button
                onClick={() => handleTabChange('pricing')}
                className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition-all font-display ${
                  activeTab === 'pricing'
                    ? 'text-white bg-white/[0.08] border border-white/15 shadow-sm'
                    : 'text-stone-400 hover:text-white hover:bg-white/[0.04]'
                }`}
                data-demo-interactive="true"
              >
                Pricing
              </button>
              <button
                onClick={() => handleTabChange('reviews')}
                className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition-all font-display ${
                  activeTab === 'reviews'
                    ? 'text-white bg-white/[0.08] border border-white/15 shadow-sm'
                    : 'text-stone-400 hover:text-white hover:bg-white/[0.04]'
                }`}
                data-demo-interactive="true"
              >
                Reviews
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="text-xs font-mono font-medium text-stone-400 hover:text-white px-3 py-1.5 transition-colors"
              data-demo-interactive="true"
            >
              Sign In
            </button>
            <button
              className="text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 px-4 py-2 rounded-xl hover:from-amber-400 hover:to-orange-500 transition-all shadow-[0_0_20px_rgba(245,158,11,0.35)]"
              data-demo-interactive="true"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 px-4 overflow-hidden border-b border-stone-800 z-10">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div
            className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3.5 py-1.5 rounded-full text-xs font-mono mb-6 cursor-pointer hover:bg-amber-500/20 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            data-demo-interactive="true"
          >
            <Sparkles className="w-3.5 h-3.5" /> Architecting The Autonomous Cloud Edge
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight font-display text-gradient-silver">
            Build Intelligent Applications at
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400"> Global Scale</span>
          </h1>

          <p className="text-sm md:text-base text-stone-400 mb-9 max-w-2xl mx-auto leading-relaxed">
            A developer cloud platform combining distributed V8 isolates, real-time edge persistence,
            and automated telemetry tracking. Every interaction on this page streams directly to Pulse Analytics.
          </p>

          <div className="flex items-center justify-center gap-3.5 flex-wrap">
            <button
              className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:opacity-95 text-stone-950 px-6 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.35)]"
              data-demo-interactive="true"
            >
              Deploy Free Cluster <ArrowRight className="w-4 h-4" />
            </button>
            <button
              className="bg-stone-900/80 hover:bg-stone-800 text-stone-300 border border-stone-700 px-6 py-3 rounded-xl text-xs font-bold transition-colors shadow-sm"
              data-demo-interactive="true"
            >
              Explore Architecture
            </button>
          </div>

          {/* Interactive Code Preview Window with Awwwards Warm Look */}
          <div className="mt-14 max-w-2xl mx-auto rounded-2xl border border-stone-800 bg-[#141210]/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden text-left relative group">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
            <div className="px-4 py-3 bg-[#0c0a09]/80 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs font-mono text-stone-500">pipeline.telemetry.ts</span>
              </div>
              <Terminal className="w-4 h-4 text-amber-400" />
            </div>
            <div className="p-5 font-mono text-xs text-stone-300 leading-relaxed overflow-x-auto">
              <p><span className="text-orange-400">import</span> &#123; createTracker &#125; <span className="text-orange-400">from</span> <span className="text-emerald-400">'@pulse/tracker-sdk'</span>;</p>
              <p className="mt-1.5 text-stone-500">// Instant automatic session identification & click heatmap</p>
              <p className="mt-1.5"><span className="text-amber-400">const</span> analytics = <span className="text-yellow-400">createTracker</span>(&#123; batchSize: <span className="text-orange-400">5</span>, intervalMs: <span className="text-orange-400">2000</span> &#125;);</p>
              <p><span className="text-stone-400">analytics</span>.<span className="text-yellow-400">observe</span>(document.body);</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Search Section */}
      <section className="py-8 px-4 max-w-2xl mx-auto relative z-10">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-500" />
          <input
            type="text"
            placeholder="Search API endpoints, edge functions, telemetry logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-stone-900/80 border border-stone-800 rounded-2xl text-xs font-mono text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
            data-demo-interactive="true"
          />
        </div>
      </section>

      {/* Tab: Features */}
      {activeTab === 'features' && (
        <section className="py-14 px-4 max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-display text-gradient-bone">
              Full-Stack Cloud Infrastructure
            </h2>
            <p className="text-stone-400 text-xs font-mono mt-1.5">Engineered for sub-10ms latency and high observability</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Cpu className="w-5 h-5 text-amber-400" />,
                title: 'Edge Compute Engine',
                description: 'Distributed V8 isolates executing at over 300 edge locations worldwide with cold-start acceleration.',
              },
              {
                icon: <BarChart3 className="w-5 h-5 text-orange-400" />,
                title: 'Real-time Telemetry',
                description: 'Capture user sessions, bounce dropoffs, and coordinate heatmaps without impacting page rendering speed.',
              },
              {
                icon: <Shield className="w-5 h-5 text-stone-300" />,
                title: 'Encrypted Persistence',
                description: 'MongoDB Atlas integration with resilient batch queue flushing, beacon reliability, and strict validation.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-stone-800 bg-stone-900/60 backdrop-blur-xl p-6 hover:border-amber-500/40 hover:bg-stone-900/80 transition-all cursor-pointer group shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                data-demo-interactive="true"
              >
                <div className="p-3 bg-stone-800/80 rounded-xl w-fit mb-4 border border-stone-700/60 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-white mb-2 font-display">{f.title}</h3>
                <p className="text-xs text-stone-400 leading-relaxed font-sans">{f.description}</p>
                <div className="mt-5 flex items-center text-xs font-mono text-amber-400 group-hover:text-amber-300">
                  Inspect docs <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tab: Pricing */}
      {activeTab === 'pricing' && (
        <section className="py-14 px-4 max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-display text-gradient-bone">
              Transparent Developer Pricing
            </h2>
            <p className="text-stone-400 text-xs font-mono mt-1.5">Scale effortlessly from side project to global enterprise</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Developer', price: '$0', desc: 'Up to 25k monthly events', popular: false },
              { name: 'Production', price: '$49', desc: 'Up to 500k monthly events', popular: true },
              { name: 'Enterprise', price: '$249', desc: 'Unlimited events & dedicated cluster', popular: false },
            ].map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl p-6 border transition-all ${
                  p.popular
                    ? 'border-amber-500/70 bg-stone-900/90 ring-1 ring-amber-500/40 shadow-[0_0_35px_rgba(245,158,11,0.15)]'
                    : 'border-stone-800 bg-stone-900/50 hover:border-stone-700'
                }`}
                data-demo-interactive="true"
              >
                {p.popular && (
                  <span className="bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full mb-3 inline-block shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                    Recommended
                  </span>
                )}
                <h3 className="text-base font-bold text-white font-display">{p.name}</h3>
                <div className="my-3 flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold font-mono text-white">{p.price}</span>
                  <span className="text-xs text-stone-500 font-mono"> / month</span>
                </div>
                <p className="text-xs text-stone-400 mb-6 font-sans">{p.desc}</p>
                <button
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                    p.popular
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 hover:from-amber-400 hover:to-orange-500 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                      : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700/80 border border-stone-700/60'
                  }`}
                  data-demo-interactive="true"
                >
                  Deploy Plan
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tab: Reviews */}
      {activeTab === 'reviews' && (
        <section className="py-14 px-4 max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-display text-gradient-bone">
              Trusted by Engineering Teams
            </h2>
            <p className="text-stone-400 text-xs font-mono mt-1.5">Real feedback from infrastructure engineers</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                quote: 'Pulse Analytics gave our telemetry pipeline zero-overhead click precision within minutes.',
                author: 'Sarah Chen',
                role: 'Staff Infrastructure Engineer, Acme Global',
              },
              {
                quote: 'The heatmap visualization works flawlessly without impacting client performance.',
                author: 'Marcus Vance',
                role: 'VP of Engineering, FinTech Cloud',
              },
            ].map((t) => (
              <div
                key={t.author}
                className="rounded-2xl border border-stone-800 bg-stone-900/60 backdrop-blur-xl p-6 cursor-pointer hover:border-stone-700 transition-all shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                data-demo-interactive="true"
              >
                <div className="flex gap-1 mb-3.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-stone-300 text-xs mb-4 italic leading-relaxed">"{t.quote}"</p>
                <p className="text-xs font-bold text-white font-display">{t.author}</p>
                <p className="text-[11px] font-mono text-stone-500">{t.role}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bottom CTA Banner */}
      <section className="py-16 px-4 border-t border-stone-800 bg-[#120f0d] relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <Globe className="w-8 h-8 text-amber-400 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-white mb-2 font-display">Ready to inspect your analytics?</h2>
          <p className="text-stone-400 text-xs mb-6 max-w-md mx-auto font-mono">
            Switch over to the Pulse Analytics Dashboard to see your generated sessions and click heatmaps updated in real time.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              to="/"
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-stone-950 px-5 py-2.5 rounded-xl text-xs font-bold font-mono transition-all inline-flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.25)]"
              data-demo-interactive="true"
            >
              Open Analytics Dashboard <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-800/80 py-6 px-4 text-xs font-mono text-stone-500 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <p>© 2024 TechFlow Cloud Platform. Tracked with Pulse Analytics SDK.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-stone-300 cursor-pointer" data-demo-interactive="true">
              Privacy Policy
            </span>
            <span className="hover:text-stone-300 cursor-pointer" data-demo-interactive="true">
              Terms of Service
            </span>
            <span className="hover:text-stone-300 cursor-pointer" data-demo-interactive="true">
              Documentation
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
