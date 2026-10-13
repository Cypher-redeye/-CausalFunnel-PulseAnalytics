import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Play,
  RotateCw,
  ExternalLink,
  Cpu,
  BarChart3,
  Shield,
  Star,
  Search,
  Globe,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Zap,
  Terminal,
} from 'lucide-react';

declare global {
  interface Window {
    _pulseTracker?: {
      flush: () => void;
      trackPageView?: (url: string) => void;
      trackClick?: (x: number, y: number) => void;
      getSessionId?: () => string;
    };
  }
}

export default function DemoPage() {
  const [clickCount, setClickCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'features' | 'pricing' | 'reviews'>('features');
  const [searchQuery, setSearchQuery] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Retrieve current session from tracker (stored in sessionStorage)
  const sessionId = sessionStorage.getItem('pulse_session_id') || 'active-session';

  // Listen for click increments
  useEffect(() => {
    const handleClick = () => {
      setClickCount((prev) => prev + 1);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Flush tracker manually
  const handleManualFlush = () => {
    if (window._pulseTracker) {
      window._pulseTracker.flush();
      setNotification('Event queue flushed to API successfully!');
      setTimeout(() => setNotification(null), 2500);
    }
  };

  // Simulate realistic clicks
  const handleGenerateDemoActivity = async () => {
    setSimulating(true);
    setNotification('Simulating realistic user click interactions...');

    const interactiveElements = document.querySelectorAll<HTMLElement>(
      'button, a, input, [data-demo-interactive="true"]'
    );

    if (interactiveElements.length === 0) {
      setSimulating(false);
      return;
    }

    const clickSequence = [0, 1, 2, 3, 4];
    for (const idx of clickSequence) {
      await new Promise((r) => setTimeout(r, 400 + Math.random() * 300));
      const target = interactiveElements[idx % interactiveElements.length];
      if (target) {
        const rect = target.getBoundingClientRect();
        const evt = new MouseEvent('click', {
          clientX: Math.round(rect.left + rect.width / 2),
          clientY: Math.round(rect.top + rect.height / 2),
          bubbles: true,
          cancelable: true,
        });
        target.dispatchEvent(evt);
      }
    }

    if (window._pulseTracker) {
      window._pulseTracker.flush();
    }

    setSimulating(false);
    setNotification('Simulated 5 user clicks & flushed event queue to MongoDB!');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleTabChange = (tab: 'features' | 'pricing' | 'reviews') => {
    setActiveTab(tab);
    if (window._pulseTracker) {
      setNotification(`Switched view to ${tab.toUpperCase()}`);
      setTimeout(() => setNotification(null), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-stone-900 antialiased font-sans relative overflow-x-hidden" data-demo-page="true">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 bg-neutral-mesh pointer-events-none z-0" />
      <div className="fixed inset-0 bg-grid-subtle opacity-50 pointer-events-none z-0" />

      {/* Telemetry Status Strip */}
      <div className="bg-white/90 backdrop-blur-md text-stone-800 text-xs py-2.5 px-4 sticky top-0 z-50 border-b border-stone-200 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Tracker Active
            </span>
            <span className="text-stone-300 hidden sm:inline">|</span>
            <span className="text-stone-600 text-xs font-mono">
              Session: <span className="text-stone-900 font-bold">{sessionId.substring(0, 18)}...</span>
            </span>
            <span className="text-stone-300 hidden md:inline">|</span>
            <span className="text-stone-600 text-xs hidden md:inline font-medium">
              Clicks: <span className="font-bold text-amber-700 font-mono">{clickCount}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateDemoActivity}
              disabled={simulating}
              className="inline-flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs px-3.5 py-1.5 rounded-xl transition-all disabled:opacity-50 shadow-xs active:scale-95"
              title="Automatically simulate realistic user clicks"
            >
              <Play className="w-3 h-3" />
              {simulating ? 'Simulating...' : 'Simulate Activity'}
            </button>
            <button
              onClick={handleManualFlush}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-stone-50 text-stone-700 text-xs px-3 py-1.5 rounded-xl border border-stone-200 transition-colors shadow-2xs"
              title="Flush event queue to API immediately"
            >
              <RotateCw className="w-3 h-3 text-stone-500" />
              Flush
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 bg-white hover:bg-stone-50 text-stone-800 font-semibold text-xs px-3.5 py-1.5 rounded-xl border border-stone-200 transition-all shadow-2xs"
            >
              Dashboard <ExternalLink className="w-3 h-3 text-stone-500" />
            </Link>
          </div>
        </div>
      </div>

      {notification && (
        <div className="bg-stone-900 text-white text-center text-xs py-2 px-4 animate-fade-in font-medium relative z-50">
          {notification}
        </div>
      )}

      {/* Modern Navigation Header */}
      <header className="border-b border-stone-200/80 bg-white/80 backdrop-blur-md relative z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div
              className="flex items-center gap-2.5 text-stone-900 font-bold tracking-tight cursor-pointer font-display"
              data-demo-interactive="true"
            >
              <div className="w-8 h-8 rounded-xl bg-stone-900 flex items-center justify-center text-white shadow-xs">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-base tracking-tight font-display">TechFlow Cloud</span>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => handleTabChange('features')}
                className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition-all font-display ${
                  activeTab === 'features'
                    ? 'text-stone-900 bg-stone-100 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
                data-demo-interactive="true"
              >
                Features
              </button>
              <button
                onClick={() => handleTabChange('pricing')}
                className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition-all font-display ${
                  activeTab === 'pricing'
                    ? 'text-stone-900 bg-stone-100 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
                data-demo-interactive="true"
              >
                Pricing
              </button>
              <button
                onClick={() => handleTabChange('reviews')}
                className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition-all font-display ${
                  activeTab === 'reviews'
                    ? 'text-stone-900 bg-stone-100 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
                data-demo-interactive="true"
              >
                Reviews
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setNotification('⚡ "Sign In" clicked — recorded & flushed to Pulse Analytics!');
                if (window._pulseTracker) window._pulseTracker.flush();
                setTimeout(() => setNotification(null), 3000);
              }}
              className="text-xs font-semibold text-stone-600 hover:text-stone-900 px-3 py-1.5 transition-colors cursor-pointer"
              data-demo-interactive="true"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setNotification('⚡ "Get Started" clicked — recorded & flushed to Pulse Analytics!');
                if (window._pulseTracker) window._pulseTracker.flush();
                setTimeout(() => setNotification(null), 3000);
              }}
              className="text-xs font-semibold bg-stone-900 text-white px-4 py-2 rounded-xl hover:bg-stone-800 transition-all shadow-xs active:scale-95 cursor-pointer"
              data-demo-interactive="true"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden border-b border-stone-200/80 z-10 bg-gradient-to-b from-stone-50/50 to-white">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div
            className="inline-flex items-center gap-2 bg-stone-100 text-stone-700 border border-stone-200 px-3.5 py-1.5 rounded-full text-xs font-medium mb-6 cursor-pointer hover:bg-stone-200/70 transition-all shadow-2xs"
            data-demo-interactive="true"
          >
            <Sparkles className="w-3.5 h-3.5 text-stone-500" /> Intelligent Cloud Platform & Analytics
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-stone-900 mb-5 leading-tight tracking-tight font-display">
            Build Intelligent Applications at
            <span className="text-stone-600"> Global Scale</span>
          </h1>

          <p className="text-sm md:text-base text-stone-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            A developer platform combining high-performance compute, real-time edge persistence,
            and automated telemetry tracking. Every interaction on this page streams directly to Pulse Analytics.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => {
                setNotification('⚡ "Deploy Free Cluster" clicked — recorded & flushed to Pulse Analytics!');
                if (window._pulseTracker) window._pulseTracker.flush();
                setTimeout(() => setNotification(null), 3000);
              }}
              className="bg-stone-900 hover:bg-stone-800 text-white px-6 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer"
              data-demo-interactive="true"
            >
              Deploy Free Cluster <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setNotification('⚡ "Explore Architecture" clicked — recorded & flushed to Pulse Analytics!');
                if (window._pulseTracker) window._pulseTracker.flush();
                setTimeout(() => setNotification(null), 3000);
              }}
              className="bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 px-6 py-3 rounded-xl text-xs font-semibold transition-colors shadow-2xs active:scale-95 cursor-pointer"
              data-demo-interactive="true"
            >
              Explore Architecture
            </button>
          </div>

          {/* Clean Platform Code Window */}
          <div className="mt-12 max-w-2xl mx-auto rounded-2xl border border-stone-200 bg-white shadow-md overflow-hidden text-left relative">
            <div className="px-4 py-2.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="ml-2 text-xs font-mono text-stone-500">pipeline.telemetry.ts</span>
              </div>
              <Terminal className="w-3.5 h-3.5 text-stone-400" />
            </div>
            <div className="p-5 font-mono text-xs text-stone-800 leading-relaxed overflow-x-auto bg-stone-50/40">
              <p><span className="text-stone-500 font-semibold">import</span> &#123; createTracker &#125; <span className="text-stone-500 font-semibold">from</span> <span className="text-emerald-700">'@pulse/tracker-sdk'</span>;</p>
              <p className="mt-1.5 text-stone-400">// Automatic session identification & click heatmap</p>
              <p className="mt-1.5"><span className="text-stone-600 font-semibold">const</span> analytics = <span className="text-stone-900 font-bold">createTracker</span>(&#123; batchSize: <span className="text-amber-700 font-bold">5</span>, intervalMs: <span className="text-amber-700 font-bold">2000</span> &#125;);</p>
              <p><span className="text-stone-600">analytics</span>.<span className="text-stone-900 font-bold">observe</span>(document.body);</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Search Section */}
      <section className="py-8 px-4 max-w-2xl mx-auto relative z-10">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
          <input
            type="text"
            placeholder="Search API endpoints, functions, and documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-2xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all shadow-xs"
            data-demo-interactive="true"
          />
        </div>
      </section>

      {/* Tab: Features */}
      {activeTab === 'features' && (
        <section className="py-14 px-4 max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-stone-900 font-display">
              Cloud Infrastructure Platform
            </h2>
            <p className="text-stone-500 text-xs mt-1.5">Engineered for sub-10ms latency and high observability</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Cpu className="w-5 h-5 text-stone-700" />,
                title: 'Edge Compute Engine',
                description: 'Distributed V8 isolates executing at over 300 edge locations worldwide with cold-start acceleration.',
              },
              {
                icon: <BarChart3 className="w-5 h-5 text-stone-700" />,
                title: 'Real-time Telemetry',
                description: 'Capture user sessions, bounce dropoffs, and coordinate heatmaps without impacting page rendering speed.',
              },
              {
                icon: <Shield className="w-5 h-5 text-stone-700" />,
                title: 'Encrypted Persistence',
                description: 'MongoDB Atlas integration with resilient batch queue flushing, beacon reliability, and strict validation.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="neutral-card neutral-card-hover p-6 cursor-pointer group"
                data-demo-interactive="true"
              >
                <div className="p-3 bg-stone-100 rounded-xl w-fit mb-4 group-hover:scale-105 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-stone-900 mb-2 font-display">{f.title}</h3>
                <p className="text-xs text-stone-500 leading-relaxed">{f.description}</p>
                <div className="mt-5 flex items-center text-xs font-semibold text-stone-900 group-hover:text-stone-700">
                  Inspect docs <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
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
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-stone-900 font-display">
              Transparent Pricing Plans
            </h2>
            <p className="text-stone-500 text-xs mt-1.5">Scale effortlessly from side project to global enterprise</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Developer', price: '$0', desc: 'Up to 25k monthly events', popular: false },
              { name: 'Production', price: '$49', desc: 'Up to 500k monthly events', popular: true },
              { name: 'Enterprise', price: '$249', desc: 'Unlimited events & dedicated cluster', popular: false },
            ].map((p) => (
              <div
                key={p.name}
                className={`neutral-card p-6 transition-all ${
                  p.popular
                    ? 'border-stone-900 ring-2 ring-stone-900/10 shadow-md'
                    : 'border-stone-200'
                }`}
                data-demo-interactive="true"
              >
                {p.popular && (
                  <span className="bg-stone-900 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-3 inline-block">
                    Recommended
                  </span>
                )}
                <h3 className="text-base font-bold text-stone-900 font-display">{p.name}</h3>
                <div className="my-3 flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold text-stone-900">{p.price}</span>
                  <span className="text-xs text-stone-500"> / month</span>
                </div>
                <p className="text-xs text-stone-500 mb-6">{p.desc}</p>
                <button
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                    p.popular
                      ? 'bg-stone-900 text-white hover:bg-stone-800 shadow-xs'
                      : 'bg-stone-100 text-stone-800 hover:bg-stone-200'
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
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-stone-900 font-display">
              Trusted by Engineering Teams
            </h2>
            <p className="text-stone-500 text-xs mt-1.5">Real feedback from infrastructure engineers</p>
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
                className="neutral-card p-6 cursor-pointer hover:border-stone-300 transition-all"
                data-demo-interactive="true"
              >
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-stone-700 text-xs mb-4 italic leading-relaxed">"{t.quote}"</p>
                <p className="text-xs font-bold text-stone-900 font-display">{t.author}</p>
                <p className="text-[11px] text-stone-500">{t.role}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bottom CTA Banner */}
      <section className="py-16 px-4 border-t border-stone-200 bg-stone-100/70 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <Globe className="w-8 h-8 text-stone-700 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-stone-900 mb-2 font-display">Ready to inspect your analytics?</h2>
          <p className="text-stone-600 text-xs mb-6 max-w-md mx-auto">
            Switch over to the Pulse Analytics Dashboard to see your generated sessions and click heatmaps updated in real time.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              to="/"
              className="bg-stone-900 hover:bg-stone-800 text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-2 shadow-xs active:scale-95"
              data-demo-interactive="true"
            >
              Open Analytics Dashboard <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 py-6 px-4 text-xs text-stone-500 bg-white relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <p>© 2024 TechFlow Cloud Platform. Tracked with Pulse Analytics SDK.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-stone-900 cursor-pointer" data-demo-interactive="true">
              Privacy Policy
            </span>
            <span className="hover:text-stone-900 cursor-pointer" data-demo-interactive="true">
              Terms of Service
            </span>
            <span className="hover:text-stone-900 cursor-pointer" data-demo-interactive="true">
              Documentation
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
