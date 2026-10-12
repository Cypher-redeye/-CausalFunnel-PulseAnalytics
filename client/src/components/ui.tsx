import { Loader2, AlertCircle, Inbox, RefreshCw, Activity } from 'lucide-react';
import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 shadow-sm flex items-center justify-center mb-4">
        <Loader2 className="w-5 h-5 text-stone-700 animate-spin" />
      </div>
      <p className="text-sm font-medium text-stone-600">
        {message}
      </p>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 rounded-2xl border border-red-200 bg-white shadow-sm text-center">
      <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-3 text-red-600">
        <AlertCircle className="w-6 h-6" />
      </div>
      <p className="text-sm font-semibold text-stone-900 mb-1">{message}</p>
      <p className="text-xs text-stone-500 mb-5 max-w-sm">We couldn't connect to the analytics service. Please verify the connection and try again.</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-all shadow-sm active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
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
    <div className="flex flex-col items-center justify-center py-16 px-6 rounded-2xl border border-dashed border-stone-300 bg-white/60 text-center">
      <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center mb-3 text-stone-400">
        <Inbox className="w-5 h-5" />
      </div>
      <p className="text-sm font-semibold text-stone-900 mb-1 font-display">{title}</p>
      {description && (
        <p className="text-xs text-stone-500 max-w-sm mb-5 leading-relaxed">{description}</p>
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
    <div className="neutral-card neutral-card-hover p-6 relative group overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-stone-500 tracking-wide">
          {label}
        </span>
        <div className={`p-2.5 rounded-xl border border-stone-100 shadow-sm transition-transform duration-200 group-hover:scale-105 ${color}`}>
          {icon}
        </div>
      </div>

      {/* Metric value and subtitle */}
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-3xl font-extrabold tracking-tight text-stone-900 font-display tabular-nums">
          {value}
        </p>
        {subtitle && (
          <span className="text-xs font-medium text-stone-600 px-2.5 py-0.5 rounded-full bg-stone-100 border border-stone-200">
            {subtitle}
          </span>
        )}
      </div>

      {/* Clean Status Indicator */}
      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-medium">Active tracking</span>
        </span>
        <span className="text-stone-400 font-medium">Real-time</span>
      </div>
    </div>
  );
}
