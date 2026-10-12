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
    <div className="flex h-screen bg-[#06080d] text-slate-200 antialiased font-sans selection:bg-cyan-500/30 selection:text-white relative overflow-hidden">
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

      {/* Floating Awwwards glass sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#090d15]/80 backdrop-blur-2xl border-r border-white/[0.08] flex flex-col justify-between transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="flex items-center justify-between px-5 h-16 border-b border-white/[0.08] relative">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 shadow-[0_0_20px_rgba(6,182,212,0.35)] text-white">
                <Activity className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#090d15] animate-ping" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#090d15]" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-white font-display flex items-center gap-1.5">
                  Pulse Analytics
                </span>
                <span className="text-[10px] font-mono text-cyan-400/80 tracking-widest uppercase">
                  telemetry · v1.2
                </span>
              </div>
            </div>
            <button
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation */}
          <div className="px-3 pt-6 pb-2">
            <div className="px-3 flex items-center justify-between mb-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              <span>Navigation</span>
              <span className="text-cyan-400/60">[ HUD ]</span>
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
                        ? 'bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-transparent text-white border border-cyan-500/30 shadow-[0_0_20px_-3px_rgba(6,182,212,0.2)]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
                    }`
                  }
                  end={to === '/'}
                >
                  {({ isActive }) => (
                    <>
                      {/* Active indicator bar */}
                      {isActive && (
                        <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                      )}

                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                            isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                          }`}
                        />
                        <span className="font-display tracking-wide">{label}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Audio equalizer visualization on active */}
                        {isActive && (
                          <div className="flex items-end gap-0.5 h-3 mr-1">
                            <span className="w-0.5 bg-cyan-400 rounded-full animate-eq-1" />
                            <span className="w-0.5 bg-cyan-400 rounded-full animate-eq-2" />
                            <span className="w-0.5 bg-cyan-400 rounded-full animate-eq-3" />
                          </div>
                        )}
                        <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.5 rounded border border-white/5 bg-white/[0.02]">
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
        <div className="p-4 border-t border-white/[0.08] space-y-3 bg-[#080b12]/60 backdrop-blur-xl">
          {/* Live system status widget */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-white/[0.06] relative overflow-hidden group">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-slate-400 flex items-center gap-1.5 font-mono text-[10px]">
                <Database className="w-3 h-3 text-cyan-400" />
                MongoDB Pipeline
              </span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Online
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span className="truncate">localhost:5000/api</span>
              <Terminal className="w-3 h-3 text-slate-600 group-hover:text-cyan-400 transition-colors" />
            </div>
          </div>

          {/* Demo Website Link with Luxury Glow */}
          <NavLink
            to="/demo"
            className="group relative flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold text-emerald-300 bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-[0_0_20px_-3px_rgba(16,185,129,0.25)] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="font-display">Demo Website</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </NavLink>
        </div>
      </aside>

      {/* Main content viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Top bar header */}
        <header className="h-16 border-b border-white/[0.08] bg-[#090d15]/70 backdrop-blur-2xl flex items-center justify-between px-4 lg:px-8 shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-mono hidden sm:inline">[ PULSE ]</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 hidden sm:inline" />
              <h1 className="text-sm font-bold text-white tracking-tight font-display">
                Analytics Dashboard
              </h1>
              <span className="text-xs text-slate-500 hidden md:inline font-mono">
                / {getPageTitle()}
              </span>
            </div>
          </div>

          {/* Right header controls */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] text-[11px] font-mono text-slate-400 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Real-time Ingestion</span>
            </div>

            <NavLink
              to="/demo"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-xl transition-all shadow-sm"
            >
              <span>Test Tracker</span>
              <ExternalLink className="w-3 h-3 text-cyan-400" />
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
