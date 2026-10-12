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
 * Believable developer cloud SaaS demo website ("TechFlow Cloud").
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
    setNotification('Simulating realistic user interaction trajectory...');

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
    setNotification('✅ Generated 6 realistic click events and flushed queue to backend!');
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
    <div className="min-h-screen bg-[#090b10] text-slate-200 antialiased font-sans" data-demo-page="true">
      {/* Reviewer / Telemetry HUD Strip */}
      <div className="bg-[#0e131f] text-slate-200 text-xs py-2.5 px-4 sticky top-0 z-50 border-b border-slate-800 shadow-md backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Tracker Active
            </span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="font-mono text-slate-300 text-xs">
              Session: <span className="text-white font-semibold">{sessionId.substring(0, 18)}...</span>
            </span>
            <span className="text-slate-600 hidden md:inline">|</span>
            <span className="text-slate-400 text-xs hidden md:inline font-mono">
              Clicks: <span className="font-semibold text-emerald-400">{clickCount}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateDemoActivity}
              disabled={simulating}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-3 py-1 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
              title="Automatically simulate realistic user clicks"
            >
              <Play className="w-3 h-3" />
              {simulating ? 'Simulating...' : 'Simulate Activity'}
            </button>
            <button
              onClick={handleManualFlush}
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-1 rounded-lg border border-slate-700 transition-colors"
              title="Flush event queue to API immediately"
            >
              <RotateCw className="w-3 h-3" />
              Flush
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-3 py-1 rounded-lg transition-colors shadow-sm"
            >
              Dashboard <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {notification && (
        <div className="bg-emerald-950/80 border-b border-emerald-500/30 text-emerald-300 text-center text-xs py-2 px-4 animate-fade-in font-mono">
          {notification}
        </div>
      )}

      {/* Modern Developer Navigation Header */}
      <header className="border-b border-slate-800/80 bg-[#0d1017]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div
              className="flex items-center gap-2 text-white font-bold tracking-tight cursor-pointer"
              data-demo-interactive="true"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-base tracking-tight">TechFlow</span>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => handleTabChange('features')}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'features'
                    ? 'text-white bg-slate-800 border border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
                data-demo-interactive="true"
              >
                Features
              </button>
              <button
                onClick={() => handleTabChange('pricing')}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'pricing'
                    ? 'text-white bg-slate-800 border border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
                data-demo-interactive="true"
              >
                Pricing
              </button>
              <button
                onClick={() => handleTabChange('reviews')}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'reviews'
                    ? 'text-white bg-slate-800 border border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
                data-demo-interactive="true"
              >
                Reviews
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 transition-colors"
              data-demo-interactive="true"
            >
              Sign In
            </button>
            <button
              className="text-xs font-medium bg-blue-600 text-white px-3.5 py-1.5 rounded-lg hover:bg-blue-500 transition-colors shadow-sm shadow-blue-600/30"
              data-demo-interactive="true"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden border-b border-slate-800/80 bg-grid-subtle">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div
            className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-mono mb-6 cursor-pointer hover:bg-blue-500/20 transition-colors"
            data-demo-interactive="true"
          >
            <Sparkles className="w-3.5 h-3.5" /> Next-Gen Cloud Platform v2.4 Released
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-5 leading-tight tracking-tight">
            Build Intelligent Applications at
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400"> Global Scale</span>
          </h1>

          <p className="text-sm md:text-base text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            A developer platform combining serverless compute, instant edge databases,
            and automated telemetry tracking. Every click on this page is captured by Pulse Analytics.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/25"
              data-demo-interactive="true"
            >
              Deploy Free Cluster <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-5 py-2.5 rounded-lg text-xs font-semibold transition-colors"
              data-demo-interactive="true"
            >
              Explore Architecture
            </button>
          </div>

          {/* Interactive Code Preview Window */}
          <div className="mt-12 max-w-2xl mx-auto rounded-xl border border-slate-800 bg-[#0d111a] shadow-2xl overflow-hidden text-left">
            <div className="px-4 py-3 bg-[#0a0d14] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs font-mono text-slate-500">pipeline.telemetry.ts</span>
              </div>
              <Terminal className="w-4 h-4 text-slate-500" />
            </div>
            <div className="p-4 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto">
              <p><span className="text-purple-400">import</span> &#123; createTracker &#125; <span className="text-purple-400">from</span> <span className="text-emerald-400">'@pulse/tracker-sdk'</span>;</p>
              <p className="mt-1 text-slate-500">// Instant automatic session identification & click heatmap</p>
              <p className="mt-1"><span className="text-blue-400">const</span> analytics = <span className="text-yellow-400">createTracker</span>(&#123; batchSize: <span className="text-amber-400">5</span>, intervalMs: <span className="text-amber-400">2000</span> &#125;);</p>
              <p><span className="text-slate-400">analytics</span>.<span className="text-yellow-400">observe</span>(document.body);</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Search Section */}
      <section className="py-8 px-4 max-w-2xl mx-auto">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search API endpoints, edge functions, telemetry logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
            data-demo-interactive="true"
          />
        </div>
      </section>

      {/* Tab: Features */}
      {activeTab === 'features' && (
        <section className="py-12 px-4 max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold tracking-tight text-white">Full-Stack Cloud Infrastructure</h2>
            <p className="text-slate-400 text-xs mt-1">Engineered for low latency and high observability</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Cpu className="w-5 h-5 text-blue-400" />,
                title: 'Edge Compute Engine',
                description: 'Distributed V8 isolates executing at over 300 locations worldwide under 10ms.',
              },
              {
                icon: <BarChart3 className="w-5 h-5 text-emerald-400" />,
                title: 'Real-time Telemetry',
                description: 'Capture user sessions, bounce dropoffs, and coordinate heatmaps without page lag.',
              },
              {
                icon: <Shield className="w-5 h-5 text-purple-400" />,
                title: 'Encrypted Persistence',
                description: 'MongoDB Atlas integration with resilient batch queue flushing and audit trails.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 hover:border-slate-700 hover:bg-slate-900/80 transition-all cursor-pointer group shadow-lg shadow-black/20"
                data-demo-interactive="true"
              >
                <div className="p-2.5 bg-slate-800/80 rounded-lg w-fit mb-4 border border-slate-700/60">{f.icon}</div>
                <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.description}</p>
                <div className="mt-4 flex items-center text-xs font-mono text-blue-400 group-hover:text-blue-300">
                  Inspect docs <ChevronRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tab: Pricing */}
      {activeTab === 'pricing' && (
        <section className="py-12 px-4 max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold tracking-tight text-white">Transparent Developer Pricing</h2>
            <p className="text-slate-400 text-xs mt-1">Scale effortlessly from side project to enterprise</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Developer', price: '$0', desc: 'Up to 25k monthly events', popular: false },
              { name: 'Production', price: '$49', desc: 'Up to 500k monthly events', popular: true },
              { name: 'Enterprise', price: '$249', desc: 'Unlimited events & dedicated cluster', popular: false },
            ].map((p) => (
              <div
                key={p.name}
                className={`rounded-xl p-6 border transition-all ${
                  p.popular
                    ? 'border-blue-500/80 bg-slate-900/90 ring-1 ring-blue-500/50 shadow-xl shadow-blue-500/10'
                    : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                }`}
                data-demo-interactive="true"
              >
                {p.popular && (
                  <span className="bg-blue-600 text-white text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-3 inline-block">
                    Recommended
                  </span>
                )}
                <h3 className="text-base font-bold text-white">{p.name}</h3>
                <div className="my-3 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold font-mono text-white">{p.price}</span>
                  <span className="text-xs text-slate-500 font-mono"> / month</span>
                </div>
                <p className="text-xs text-slate-400 mb-6">{p.desc}</p>
                <button
                  className={`w-full py-2 px-4 rounded-lg text-xs font-semibold transition-colors ${
                    p.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-600/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
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
        <section className="py-12 px-4 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold tracking-tight text-white">Trusted by Engineering Teams</h2>
            <p className="text-slate-400 text-xs mt-1">Real feedback from infrastructure engineers</p>
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
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 cursor-pointer hover:border-slate-700 transition-all shadow-lg shadow-black/20"
                data-demo-interactive="true"
              >
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-xs mb-4 italic leading-relaxed">"{t.quote}"</p>
                <p className="text-xs font-semibold text-white">{t.author}</p>
                <p className="text-[11px] font-mono text-slate-500">{t.role}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bottom CTA Banner */}
      <section className="py-16 px-4 border-t border-slate-800/80 bg-[#0d1017]">
        <div className="max-w-4xl mx-auto text-center">
          <Globe className="w-8 h-8 text-blue-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">Ready to inspect your analytics?</h2>
          <p className="text-slate-400 text-xs mb-6 max-w-md mx-auto">
            Switch over to the Pulse Analytics Dashboard to see your generated sessions and click heatmaps updated in real time.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              to="/"
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-2 shadow-lg shadow-blue-600/20"
              data-demo-interactive="true"
            >
              Open Analytics Dashboard <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 px-4 text-xs font-mono text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <p>© 2024 TechFlow Cloud Platform. Tracked with Pulse Analytics.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-300 cursor-pointer" data-demo-interactive="true">
              Privacy Policy
            </span>
            <span className="hover:text-slate-300 cursor-pointer" data-demo-interactive="true">
              Terms of Service
            </span>
            <span className="hover:text-slate-300 cursor-pointer" data-demo-interactive="true">
              Documentation
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
