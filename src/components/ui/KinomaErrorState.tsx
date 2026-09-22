import React from 'react';
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';

interface KinomaErrorStateProps {
  onRetry?: () => void;
  message?: string;
  compact?: boolean;
}

export function KinomaErrorState({
  onRetry,
  message = "Kinoma couldn't connect right now.",
  compact = false
}: KinomaErrorStateProps) {
  if (compact) {
    return (
      <div className="w-full py-8 px-4 rounded-2xl bg-[#0f1016] border border-white/10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <WifiOff className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium text-gray-300">{message}</span>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#7b1fa2] hover:bg-[#9c27b0] text-white text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full min-h-[340px] flex flex-col items-center justify-center p-8 text-center bg-[#0d0e14] border border-white/10 rounded-3xl my-6">
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4 shadow-lg shadow-red-500/5">
        <WifiOff className="w-7 h-7" />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
        {message}
      </h3>
      <p className="text-sm text-gray-400 max-w-md mt-2 leading-relaxed">
        Please check your connection and try again. Kinoma connects exclusively to our verified high-speed anime services.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-6 flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#7b1fa2] hover:bg-[#9c27b0] text-white text-sm font-bold transition-all shadow-[0_4px_16px_rgba(123,31,162,0.4)] active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}
