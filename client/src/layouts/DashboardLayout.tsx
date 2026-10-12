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
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: BarChart3, label: 'Overview', shortcut: '⌘1' },
  { to: '/sessions', icon: Users, label: 'Sessions', shortcut: '⌘2' },
  { to: '/heatmap', icon: MousePointerClick, label: 'Heatmap', shortcut: '⌘3' },
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
    <div className="flex h-screen bg-[#090b10] text-slate-200 antialiased font-sans">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0d1017] border-r border-slate-800/80 flex flex-col justify-between transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="flex items-center justify-between px-5 h-16 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20 text-white">
                <Activity className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0d1017] animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
                  Pulse Analytics
                </span>
                <span className="text-[10px] font-mono text-slate-400">v1.2 · telemetry</span>
              </div>
            </div>
            <button
              className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation */}
          <div className="px-3 pt-5 pb-2">
            <p className="px-3 text-[10px] font-mono font-medium uppercase tracking-wider text-slate-400 mb-2">
              Platform
            </p>
            <nav className="space-y-1">
              {navItems.map(({ to, icon: Icon, label, shortcut }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600/10 text-white border border-blue-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                    }`
                  }
                  end={to === '/'}
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'
                          }`}
                        />
                        <span>{label}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded border border-slate-800 bg-slate-900/60">
                        {shortcut}
                      </span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom widgets & Demo button */}
        <div className="p-4 border-t border-slate-800/80 space-y-3 bg-[#0a0d13]/50">
          {/* Live system status */}
          <div className="px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Database className="w-3 h-3 text-slate-400" />
                MongoDB Pipeline
              </span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 truncate">
              localhost:5000/api
            </p>
          </div>

          {/* Demo Website Link */}
          <NavLink
            to="/demo"
            className="group flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-medium text-emerald-300 bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-500/20 hover:border-emerald-500/30 transition-all"
          >
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Demo Website</span>
            </div>
            <ExternalLink className="w-3 h-3 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
          </NavLink>
        </div>
      </aside>

      {/* Main content viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#090b10]">
        {/* Top bar header */}
        <header className="h-16 border-b border-slate-800/80 bg-[#0d1017]/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-mono hidden sm:inline">Pulse Analytics</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
              <h1 className="text-sm font-semibold text-white tracking-tight">
                Analytics Dashboard
              </h1>
              <span className="text-xs text-slate-400 hidden md:inline font-mono">
                · {getPageTitle()}
              </span>
            </div>
          </div>

          {/* Right header controls */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-800 bg-slate-900/80 text-[11px] font-mono text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Real-time Ingestion
            </div>
            <NavLink
              to="/demo"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-lg transition-colors"
            >
              <span>Test Tracker</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </NavLink>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-8 bg-grid-subtle">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
