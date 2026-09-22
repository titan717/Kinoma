import React from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';
import { Button } from './Button';

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
      <div className="w-full py-6 px-4 rounded-2xl bg-[#0e1017] border border-white/10 flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
            <WifiOff className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium text-gray-300">{message}</span>
        </div>
        {onRetry && (
          <Button
            size="sm"
            variant="primary"
            onClick={onRetry}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Retry
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full min-h-[320px] flex flex-col items-center justify-center p-8 text-center bg-[#0e1017] border border-white/10 rounded-3xl my-6 shadow-md">
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4 shadow-lg shadow-rose-500/5">
        <WifiOff className="w-7 h-7" />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
        {message}
      </h3>
      <p className="text-sm text-gray-400 max-w-md mt-2 leading-relaxed">
        Please check your network and try again. Kinoma streaming operates continuously with our verified high-speed anime services.
      </p>
      {onRetry && (
        <div className="mt-6">
          <Button
            size="md"
            variant="primary"
            onClick={onRetry}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Retry Connection
          </Button>
        </div>
      )}
    </div>
  );
}

