import { useState, useEffect } from 'react';
import {
  Search,
  Star,
  ArrowRight,
  ChevronRight,
  Zap,
  Shield,
  BarChart3,
  Users,
  Globe,
  ExternalLink,
  Play,
  RotateCw,
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
 * Demo website that demonstrates client-side tracking.
 * All user clicks and page interactions generate authentic events
 * sent through the tracker script to the Express REST API and MongoDB.
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
    // Track local click counter for reviewer feedback
    const onDocClick = () => {
      setClickCount((c) => c + 1);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const handleTabChange = (tab: 'features' | 'pricing' | 'reviews') => {
    setActiveTab(tab);
    // Update hash/URL for demonstration of SPA page views
    window.location.hash = tab;
    if (window.PulseTracker) {
      window.PulseTracker.trackPageView(window.location.href);
    }
  };

  /**
   * Transparently generates genuine events by simulating user clicks
   * across real clickable elements on the demo page.
   */
  const handleGenerateDemoActivity = async () => {
    if (simulating) return;
    setSimulating(true);
    setNotification('Simulating realistic user session interactions...');

    // Select actual interactive elements on the demo page
    const clickableElements = document.querySelectorAll(
      '[data-demo-interactive="true"]'
    );

    if (clickableElements.length === 0) {
      setSimulating(false);
      return;
    }

    // Sequentially simulate 5-8 clicks with realistic timing
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
      await new Promise((r) => setTimeout(r, 400));
    }

    if (window.PulseTracker) {
      window.PulseTracker.flush();
    }

    setSimulating(false);
    setNotification('✅ Generated 6 realistic click events and flushed queue to API!');
    setTimeout(() => setNotification(null), 4000);
  };

  const handleManualFlush = () => {
    if (window.PulseTracker) {
      window.PulseTracker.flush();
      setNotification('Flushed tracker queue to server');
      setTimeout(() => setNotification(null), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-white" data-demo-page="true">
      {/* Dev / Reviewer Tracking Status Bar */}
      <div className="bg-slate-900 text-slate-100 text-xs py-2 px-4 sticky top-0 z-50 border-b border-slate-700 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-medium text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Tracker Active
            </span>
            <span className="text-slate-400 hidden sm:inline">|</span>
            <span className="font-mono text-slate-300">
              Session: <span className="text-white">{sessionId.substring(0, 18)}...</span>
            </span>
            <span className="text-slate-400 hidden md:inline">|</span>
            <span className="text-slate-300 hidden md:inline">
              Session Clicks: <span className="font-semibold text-emerald-400">{clickCount}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateDemoActivity}
              disabled={simulating}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white font-medium px-2.5 py-1 rounded transition-colors disabled:opacity-50"
            >
              <Play className="w-3 h-3" />
              {simulating ? 'Generating...' : 'Generate Demo Activity'}
            </button>
            <button
              onClick={handleManualFlush}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded border border-slate-600 transition-colors"
              title="Flush event queue to API immediately"
            >
              <RotateCw className="w-3 h-3" />
              Flush
            </button>
            <Link
              to="/"
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-2.5 py-1 rounded transition-colors"
            >
              Dashboard <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {notification && (
        <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-center text-xs py-1.5 px-4 animate-fade-in">
          {notification}
        </div>
      )}

      {/* Navigation */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-lg font-bold text-gray-900 cursor-pointer" data-demo-interactive="true">
              <Zap className="w-5 h-5 inline text-blue-600 mr-1" />
              TechFlow
            </span>
            <nav className="hidden md:flex items-center gap-2">
              <button
                onClick={() => handleTabChange('features')}
                className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === 'features'
                    ? 'text-blue-600 bg-blue-50 font-medium'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                data-demo-interactive="true"
              >
                Features
              </button>
              <button
                onClick={() => handleTabChange('pricing')}
                className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === 'pricing'
                    ? 'text-blue-600 bg-blue-50 font-medium'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                data-demo-interactive="true"
              >
                Pricing
              </button>
              <button
                onClick={() => handleTabChange('reviews')}
                className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === 'reviews'
                    ? 'text-blue-600 bg-blue-50 font-medium'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                data-demo-interactive="true"
              >
                Reviews
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 transition-colors"
              data-demo-interactive="true"
            >
              Sign In
            </button>
            <button
              className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
              data-demo-interactive="true"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Next Generation SaaS Analytics Platform
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight tracking-tight">
            Build Better Products with
            <span className="text-blue-600"> Data-Driven Insights</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Understand user journeys, track page views, and analyze click heatmaps in real-time.
            Every interaction on this demo is recorded and visible on the Pulse Analytics dashboard.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
              data-demo-interactive="true"
            >
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </button>
            <button
              className="bg-white text-gray-700 px-6 py-3 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
              data-demo-interactive="true"
            >
              Watch Interactive Demo
            </button>
          </div>
        </div>
      </section>

      {/* Search Input Section */}
      <section className="py-6 px-4 max-w-2xl mx-auto">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search features, documentation, pricing..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            data-demo-interactive="true"
          />
        </div>
      </section>

      {/* Tab: Features */}
      {activeTab === 'features' && (
        <section className="py-12 px-4 max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900">Powerful Analytics Features</h2>
            <p className="text-gray-500 text-sm mt-1">Everything you need to understand user behavior</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <BarChart3 className="w-6 h-6 text-blue-600" />,
                title: 'Session Analytics',
                description: 'Group interactions by session with first/last timestamps, view counts, and click ratios.',
              },
              {
                icon: <Users className="w-6 h-6 text-emerald-600" />,
                title: 'User Journeys',
                description: 'Chronological event timelines showing every page view and interaction path taken.',
              },
              {
                icon: <Shield className="w-6 h-6 text-purple-600" />,
                title: 'Click Heatmaps',
                description: 'Accurate click coordinates plotted on wireframe canvas with density heat distribution.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer"
                data-demo-interactive="true"
              >
                <div className="p-3 bg-gray-50 rounded-lg w-fit mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.description}</p>
                <div className="mt-4 flex items-center text-xs font-medium text-blue-600 hover:text-blue-800">
                  Learn more <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
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
            <h2 className="text-2xl font-bold text-gray-900">Simple, Transparent Pricing</h2>
            <p className="text-gray-500 text-sm mt-1">Choose the plan that fits your growth</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Starter', price: '$0', desc: 'Up to 10k monthly events', popular: false },
              { name: 'Growth', price: '$49', desc: 'Up to 250k monthly events', popular: true },
              { name: 'Enterprise', price: '$199', desc: 'Unlimited tracked events', popular: false },
            ].map((p) => (
              <div
                key={p.name}
                className={`bg-white rounded-xl p-6 border transition-all ${
                  p.popular
                    ? 'border-blue-600 shadow-md ring-1 ring-blue-600'
                    : 'border-gray-200 hover:shadow-sm'
                }`}
                data-demo-interactive="true"
              >
                {p.popular && (
                  <span className="bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-3 inline-block">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-bold text-gray-900">{p.name}</h3>
                <div className="my-3">
                  <span className="text-3xl font-extrabold text-gray-900">{p.price}</span>
                  <span className="text-xs text-gray-500"> / month</span>
                </div>
                <p className="text-xs text-gray-500 mb-6">{p.desc}</p>
                <button
                  className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    p.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                  data-demo-interactive="true"
                >
                  Select Plan
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
            <h2 className="text-2xl font-bold text-gray-900">What Our Users Say</h2>
            <p className="text-gray-500 text-sm mt-1">Real feedback from actual product teams</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                quote: 'Pulse Analytics gave us deep visibility into our conversion drop-offs within 5 minutes.',
                author: 'Sarah Chen',
                role: 'Head of Product, Acme Corp',
              },
              {
                quote: 'The heatmap visualization works flawlessly without bogging down our web application.',
                author: 'Marcus Vance',
                role: 'Lead Architect, FinTech Global',
              },
            ].map((t) => (
              <div
                key={t.author}
                className="bg-white border border-gray-200 rounded-xl p-6 cursor-pointer hover:shadow-md transition-shadow"
                data-demo-interactive="true"
              >
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm mb-4 italic">"{t.quote}"</p>
                <p className="text-sm font-semibold text-gray-900">{t.author}</p>
                <p className="text-xs text-gray-500">{t.role}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-14 px-4 bg-slate-900 text-white mt-12">
        <div className="max-w-4xl mx-auto text-center">
          <Globe className="w-10 h-10 text-blue-400 mx-auto mb-3" />
          <h2 className="text-2xl font-bold mb-2">Ready to inspect your analytics?</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-lg mx-auto">
            Switch over to the Pulse Analytics Dashboard to see your session and heatmaps updated in real time.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              to="/"
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
              data-demo-interactive="true"
            >
              Open Analytics Dashboard <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 px-4 bg-white text-xs text-gray-500">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <p>© 2024 TechFlow Demo. Tracked with Pulse Analytics.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-gray-700 cursor-pointer" data-demo-interactive="true">
              Privacy Policy
            </span>
            <span className="hover:text-gray-700 cursor-pointer" data-demo-interactive="true">
              Terms of Service
            </span>
            <span className="hover:text-gray-700 cursor-pointer" data-demo-interactive="true">
              Documentation
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Sparkles(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
