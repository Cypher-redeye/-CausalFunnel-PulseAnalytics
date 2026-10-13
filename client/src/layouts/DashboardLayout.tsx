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
  { to: '/', icon: BarChart3, label: 'Overview' },
  { to: '/sessions', icon: Users, label: 'Sessions' },
  { to: '/heatmap', icon: MousePointerClick, label: 'Heatmap' },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    if (location.pathname.startsWith('/sessions/')) return 'Session Details';
    if (location.pathname === '/sessions') return 'All Sessions';
    if (location.pathname === '/heatmap') return 'Click Heatmap';
    return 'Overview';
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-stone-900 antialiased font-sans selection:bg-stone-200 selection:text-stone-900 relative overflow-hidden">
      {/* Subtle background ambient mesh */}
      <div className="fixed inset-0 bg-neutral-mesh pointer-events-none z-0" />
      <div className="fixed inset-0 bg-grid-subtle opacity-60 pointer-events-none z-0" />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Modern Neutral Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-stone-200/90 flex flex-col justify-between transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="flex items-center justify-between px-5 h-16 border-b border-stone-100">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-stone-900 text-white shadow-sm">
                <Activity className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-stone-900 font-display">
                  Pulse Analytics
                </span>
                <span className="text-[11px] font-medium text-stone-500">
                  User Insights
                </span>
              </div>
            </div>
            <button
              className="lg:hidden p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Menu */}
          <div className="px-3 pt-6 pb-2">
            <div className="px-3 mb-2 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              Analytics Menu
            </div>
            <nav className="space-y-1">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-stone-900 text-white shadow-sm'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                    }`
                  }
                  end={to === '/'}
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 ${
                            isActive ? 'text-white' : 'text-stone-500 group-hover:text-stone-700'
                          }`}
                        />
                        <span className="font-medium">{label}</span>
                      </div>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom Status Card & Demo Link */}
        <div className="p-4 border-t border-stone-100 space-y-2.5 bg-stone-50/50">
          {/* Database Status Card */}
          <div className="p-3 rounded-xl bg-white border border-stone-200/80 shadow-xs">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-stone-600 flex items-center gap-1.5 font-medium">
                <Database className="w-3.5 h-3.5 text-stone-500" />
                MongoDB Pipeline
              </span>
              <span className="flex items-center gap-1 font-semibold text-emerald-600 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Connected
              </span>
            </div>
            <p className="text-[11px] text-stone-400">Storing sessions & click coords</p>
          </div>

          {/* Demo Website Link */}
          <NavLink
            to="/demo"
            className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 shadow-xs transition-colors"
          >
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-stone-500" />
              <span>Interactive Demo</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
          </NavLink>
        </div>
      </aside>

      {/* Main content viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Top Header */}
        <header className="h-16 border-b border-stone-200/80 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-stone-400">Dashboard</span>
              <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
              <h1 className="text-sm font-bold text-stone-900 tracking-tight font-display">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          {/* Right header controls */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-stone-200 bg-stone-50 text-xs font-medium text-stone-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Real-time Ingestion</span>
            </div>

            <NavLink
              to="/demo"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-stone-800 hover:text-stone-950 bg-stone-100 hover:bg-stone-200/70 border border-stone-200 rounded-xl transition-all shadow-xs"
            >
              <span>Test Tracker</span>
              <ExternalLink className="w-3 h-3 text-stone-600" />
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
