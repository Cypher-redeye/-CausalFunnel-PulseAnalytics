import { Loader2, AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 relative">
      <div className="relative flex items-center justify-center mb-5">
        <div className="w-14 h-14 rounded-full border border-blue-500/20 bg-blue-500/5 animate-ping absolute inset-0" />
        <div className="w-12 h-12 rounded-2xl border border-white/10 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.2)]">
          <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <p className="text-[11px] font-mono tracking-widest text-slate-400 uppercase">
          {message}
        </p>
      </div>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 rounded-2xl border border-red-500/20 bg-red-950/20 backdrop-blur-xl text-center relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
      <div className="w-12 h-12 rounded-2xl border border-red-500/30 bg-red-500/10 flex items-center justify-center mb-4 text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.2)]">
        <AlertCircle className="w-6 h-6" />
      </div>
      <p className="text-sm font-semibold text-red-300 mb-1 max-w-md">{message}</p>
      <p className="text-xs font-mono text-slate-500 mb-5">Telemetry pipeline communication interrupted</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-medium text-white bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl transition-all shadow-lg hover:shadow-cyan-500/10 hover:border-white/20"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          Try Again
        </button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 rounded-2xl border border-dashed border-white/10 bg-slate-950/40 backdrop-blur-xl text-center relative">
      <div className="w-12 h-12 rounded-2xl border border-white/10 bg-slate-900/80 flex items-center justify-center mb-4 text-slate-500 shadow-inner">
        <Inbox className="w-5 h-5 text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-200 mb-1.5 font-display">{title}</p>
      {description && (
        <p className="text-xs text-slate-400 max-w-sm mb-5 leading-relaxed font-sans">{description}</p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

export function StatCard({ label, value, icon, color, subtitle }: StatCardProps) {
  return (
    <div className="relative group overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-950/60 backdrop-blur-xl p-5 transition-all duration-300 hover:border-white/20 hover:bg-slate-900/70 hover:shadow-[0_16px_40px_-10px_rgba(0,0,0,0.5),0_0_25px_-5px_rgba(59,130,246,0.15)]">
      {/* Corner technical reticle crosses */}
      <span className="absolute top-2 left-2 text-[9px] font-mono text-white/20 select-none group-hover:text-cyan-400/50 transition-colors">+</span>
      <span className="absolute top-2 right-2 text-[9px] font-mono text-white/20 select-none group-hover:text-cyan-400/50 transition-colors">+</span>

      {/* Hairline top highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Header with label and icon */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-mono font-medium text-slate-400 tracking-wider uppercase">
          {label}
        </span>
        <div className={`p-2 rounded-xl border border-white/10 backdrop-blur-md shadow-sm transition-transform duration-300 group-hover:scale-105 ${color}`}>
          {icon}
        </div>
      </div>

      {/* Metric value and subtitle */}
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-3xl font-extrabold tracking-tight text-white font-mono tabular-nums group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:via-slate-100 group-hover:to-cyan-200 transition-all">
          {value}
        </p>
        {subtitle && (
          <span className="text-[10px] font-mono text-slate-500 px-2 py-0.5 rounded-full border border-white/5 bg-white/[0.02]">
            {subtitle}
          </span>
        )}
      </div>

      {/* Micro-sparkline progress glow indicator */}
      <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between text-[10px] font-mono text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/70 animate-pulse" />
          <span>telemetry active</span>
        </span>
        <span className="text-white/30 group-hover:text-cyan-400 transition-colors">01 //</span>
      </div>
    </div>
  );
}
