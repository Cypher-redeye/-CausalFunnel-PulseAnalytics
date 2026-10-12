import { Loader2, AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 relative">
      <div className="relative flex items-center justify-center mb-5">
        <div className="w-14 h-14 rounded-full border border-amber-500/20 bg-amber-500/5 animate-ping absolute inset-0" />
        <div className="w-12 h-12 rounded-2xl border border-white/10 bg-stone-900/90 backdrop-blur-xl flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.2)]">
          <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        <p className="text-[11px] font-mono tracking-widest text-stone-400 uppercase">
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
    <div className="flex flex-col items-center justify-center py-20 px-6 rounded-2xl border border-red-500/20 bg-stone-900/90 backdrop-blur-xl text-center relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
      <div className="w-12 h-12 rounded-2xl border border-red-500/30 bg-red-500/10 flex items-center justify-center mb-4 text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.2)]">
        <AlertCircle className="w-6 h-6" />
      </div>
      <p className="text-sm font-semibold text-red-300 mb-1 max-w-md">{message}</p>
      <p className="text-xs font-mono text-stone-500 mb-5">Telemetry pipeline communication interrupted</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-medium text-white bg-stone-800 hover:bg-stone-700 border border-stone-700 hover:border-amber-500/40 rounded-xl transition-all shadow-lg hover:shadow-amber-500/10"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
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
    <div className="flex flex-col items-center justify-center py-20 px-6 rounded-2xl border border-dashed border-stone-800 bg-stone-900/40 backdrop-blur-xl text-center relative">
      <div className="w-12 h-12 rounded-2xl border border-white/10 bg-stone-900/80 flex items-center justify-center mb-4 text-stone-500 shadow-inner">
        <Inbox className="w-5 h-5 text-stone-400" />
      </div>
      <p className="text-sm font-semibold text-stone-200 mb-1.5 font-display">{title}</p>
      {description && (
        <p className="text-xs text-stone-400 max-w-sm mb-5 leading-relaxed font-sans">{description}</p>
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
    <div className="relative group overflow-hidden rounded-2xl border border-stone-800/80 bg-stone-900/60 backdrop-blur-xl p-5 transition-all duration-300 hover:border-amber-500/30 hover:bg-stone-900/80 hover:shadow-[0_16px_40px_-10px_rgba(0,0,0,0.6),0_0_25px_-5px_rgba(245,158,11,0.15)]">
      {/* Corner technical reticle crosses */}
      <span className="absolute top-2 left-2 text-[9px] font-mono text-stone-600 select-none group-hover:text-amber-400/60 transition-colors">+</span>
      <span className="absolute top-2 right-2 text-[9px] font-mono text-stone-600 select-none group-hover:text-amber-400/60 transition-colors">+</span>

      {/* Hairline top highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/35 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Header with label and icon */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-mono font-medium text-stone-400 tracking-wider uppercase">
          {label}
        </span>
        <div className={`p-2 rounded-xl border border-white/10 backdrop-blur-md shadow-sm transition-transform duration-300 group-hover:scale-105 ${color}`}>
          {icon}
        </div>
      </div>

      {/* Metric value and subtitle */}
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-3xl font-extrabold tracking-tight text-white font-mono tabular-nums group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:via-stone-100 group-hover:to-amber-200 transition-all">
          {value}
        </p>
        {subtitle && (
          <span className="text-[10px] font-mono text-stone-400 px-2 py-0.5 rounded-full border border-stone-800 bg-stone-800/40">
            {subtitle}
          </span>
        )}
      </div>

      {/* Micro-sparkline progress glow indicator */}
      <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-[10px] font-mono text-stone-500">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 animate-pulse" />
          <span>telemetry active</span>
        </span>
        <span className="text-stone-600 group-hover:text-amber-400 transition-colors">01 //</span>
      </div>
    </div>
  );
}
