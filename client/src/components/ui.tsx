import { Loader2, AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="relative flex items-center justify-center mb-4">
        <div className="w-10 h-10 rounded-full border border-blue-500/20 bg-blue-500/5 animate-ping absolute inset-0" />
        <div className="w-10 h-10 rounded-xl border border-blue-500/30 bg-slate-900 flex items-center justify-center shadow-lg shadow-blue-500/10">
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
        </div>
      </div>
      <p className="text-xs font-mono tracking-wide text-slate-400 uppercase">{message}</p>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 rounded-xl border border-red-500/20 bg-red-950/10">
      <div className="w-11 h-11 rounded-xl border border-red-500/30 bg-red-500/10 flex items-center justify-center mb-3 text-red-400">
        <AlertCircle className="w-5 h-5" />
      </div>
      <p className="text-sm font-medium text-red-400 mb-1 text-center max-w-md">{message}</p>
      <p className="text-xs text-slate-500 mb-4 text-center">Backend communication interrupted or data unavailable</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors shadow-sm"
        >
          <RefreshCw className="w-3 h-3 text-slate-400" />
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
    <div className="flex flex-col items-center justify-center py-16 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 text-center">
      <div className="w-10 h-10 rounded-xl border border-slate-800 bg-slate-900/80 flex items-center justify-center mb-3 text-slate-500 shadow-inner">
        <Inbox className="w-5 h-5" />
      </div>
      <p className="text-sm font-medium text-slate-300 mb-1">{title}</p>
      {description && (
        <p className="text-xs text-slate-500 max-w-sm mb-4 leading-relaxed">{description}</p>
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
  trend?: string;
  subtitle?: string;
}

export function StatCard({ label, value, icon, color, subtitle }: StatCardProps) {
  return (
    <div className="relative group overflow-hidden rounded-xl border border-slate-800/90 bg-slate-900/60 backdrop-blur-md p-5 transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/80 hover:shadow-lg hover:shadow-black/40">
      {/* Subtle top border highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-700/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-400 tracking-wider uppercase">{label}</span>
        <div className={`p-2 rounded-lg border border-slate-800/80 ${color}`}>
          {icon}
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <p className="text-2xl font-bold tracking-tight text-white font-mono tabular-nums">{value}</p>
        {subtitle && (
          <span className="text-[11px] font-mono text-slate-500 truncate">{subtitle}</span>
        )}
      </div>
    </div>
  );
}
