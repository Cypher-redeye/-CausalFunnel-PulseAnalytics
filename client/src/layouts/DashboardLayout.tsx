import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Users,
  MousePointerClick,
  Activity,
  Menu,
  X,
  Radio,
  ExternalLink,
  ChevronRight,
  Database,
  Terminal,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: BarChart3, label: 'Overview', shortcut: '⌘1', tag: '01' },
  { to: '/sessions', icon: Users, label: 'Sessions', shortcut: '⌘2', tag: '02' },
  { to: '/heatmap', icon: MousePointerClick, label: 'Heatmap', shortcut: '⌘3', tag: '03' },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    if (location.pathname.startsWith('/sessions/')) return 'Session Inspection';
    if (location.pathname === '/sessions') return 'Session Explorer';
    if (location.pathname === '/heatmap') return 'Click Heatmap Visualizer';
    return 'Analytics Overview';
  };

  return (
    <div className="flex h-screen bg-[#0c0a09] text-stone-200 antialiased font-sans selection:bg-amber-500/30 selection:text-white relative overflow-hidden">
      {/* Ambient background aura glow */}
      <div className="fixed inset-0 bg-aurora-glow pointer-events-none z-0" />
      <div className="fixed inset-0 bg-grid-cyber opacity-70 pointer-events-none z-0" />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Floating Awwwards warm glass sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#141210]/90 backdrop-blur-2xl border-r border-stone-800 flex flex-col justify-between transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="flex items-center justify-between px-5 h-16 border-b border-stone-800 relative">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 shadow-[0_0_20px_rgba(245,158,11,0.35)] text-stone-950">
                <Activity className="w-4 h-4 stroke-[2.5]" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#141210] animate-ping" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#141210]" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-white font-display flex items-center gap-1.5">
                  Pulse Analytics
                </span>
                <span className="text-[10px] font-mono text-amber-400/90 tracking-widest uppercase">
                  telemetry · v1.2
                </span>
              </div>
            </div>
            <button
              className="lg:hidden p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/5 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation */}
          <div className="px-3 pt-6 pb-2">
            <div className="px-3 flex items-center justify-between mb-3 text-[10px] font-mono text-stone-500 uppercase tracking-widest">
              <span>Navigation</span>
              <span className="text-amber-400/70">[ HUD ]</span>
            </div>
            <nav className="space-y-1.5">
              {navItems.map(({ to, icon: Icon, label, shortcut }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent text-white border border-amber-500/40 shadow-[0_0_20px_-3px_rgba(245,158,11,0.2)]'
                        : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40 border border-transparent'
                    }`
                  }
                  end={to === '/'}
                >
                  {({ isActive }) => (
                    <>
                      {/* Active indicator bar */}
                      {isActive && (
                        <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
                      )}

                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                            isActive ? 'text-amber-400' : 'text-stone-500 group-hover:text-stone-300'
                          }`}
                        />
                        <span className="font-display tracking-wide">{label}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Audio equalizer visualization on active */}
                        {isActive && (
                          <div className="flex items-end gap-0.5 h-3 mr-1">
                            <span className="w-0.5 bg-amber-400 rounded-full animate-eq-1" />
                            <span className="w-0.5 bg-amber-400 rounded-full animate-eq-2" />
                            <span className="w-0.5 bg-amber-400 rounded-full animate-eq-3" />
                          </div>
                        )}
                        <span className="text-[10px] font-mono text-stone-500 px-1.5 py-0.5 rounded border border-stone-800 bg-stone-900/60">
                          {shortcut}
                        </span>
                      </div>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom widgets & Demo button */}
        <div className="p-4 border-t border-stone-800 space-y-3 bg-[#100e0c]/80 backdrop-blur-xl">
          {/* Live system status widget */}
          <div className="p-3 rounded-xl bg-stone-950/80 border border-stone-800 relative overflow-hidden group">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-stone-400 flex items-center gap-1.5 font-mono text-[10px]">
                <Database className="w-3 h-3 text-amber-400" />
                MongoDB Pipeline
              </span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Online
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-stone-500">
              <span className="truncate">localhost:5000/api</span>
              <Terminal className="w-3 h-3 text-stone-600 group-hover:text-amber-400 transition-colors" />
            </div>
          </div>

          {/* Demo Website Link with Luxury Glow */}
          <NavLink
            to="/demo"
            className="group relative flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold text-amber-300 bg-gradient-to-r from-amber-950/50 to-stone-900 border border-amber-500/30 hover:border-amber-500/50 hover:shadow-[0_0_20px_-3px_rgba(245,158,11,0.25)] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="font-display">Demo Website</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </NavLink>
        </div>
      </aside>

      {/* Main content viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Top bar header */}
        <header className="h-16 border-b border-stone-800 bg-[#141210]/80 backdrop-blur-2xl flex items-center justify-between px-4 lg:px-8 shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/5 transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-stone-500 font-mono hidden sm:inline">[ PULSE ]</span>
              <ChevronRight className="w-3.5 h-3.5 text-stone-600 hidden sm:inline" />
              <h1 className="text-sm font-bold text-white tracking-tight font-display">
                Analytics Dashboard
              </h1>
              <span className="text-xs text-stone-500 hidden md:inline font-mono">
                / {getPageTitle()}
              </span>
            </div>
          </div>

          {/* Right header controls */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-stone-800 bg-stone-900/60 text-[11px] font-mono text-stone-400 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Real-time Ingestion</span>
            </div>

            <NavLink
              to="/demo"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-stone-300 hover:text-white bg-stone-900/70 hover:bg-stone-800 border border-stone-700 hover:border-amber-500/40 rounded-xl transition-all shadow-sm"
            >
              <span>Test Tracker</span>
              <ExternalLink className="w-3 h-3 text-amber-400" />
            </NavLink>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-8 relative">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
