import {CheckCircle2, Download, Loader2, RotateCcw} from 'lucide-react';
import {cn} from '../../lib/utils';
import type {DownloadStatus} from '../../types';

interface Props {
  status: DownloadStatus;
  percent: number;
  message: string;
  busy: boolean;
  label: string;
  onStart: () => void;
  onReset: () => void;
}

export function DownloadProgress({
  status,
  percent,
  message,
  busy,
  label,
  onStart,
  onReset,
}: Props) {
  const done = status === 'complete';
  const failed = status === 'error';

  return (
    <div className="space-y-3">
      {(busy || done || failed) && (
        <div>
          <p className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-ink-300">{message || status}</span>
            <span className="text-ink-400 font-mono">{percent}%</span>
          </p>
          <div
            className="bg-ink-700 h-1.5 overflow-hidden rounded-full"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-valuetext={message || `${percent} percent`}
            aria-label="Download progress">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                failed ? 'bg-err-500' : done ? 'bg-ok-500' : 'bg-brand-500',
              )}
              style={{width: `${Math.min(100, Math.max(0, percent))}%`}}
            />
          </div>
        </div>
      )}

      {done ? (
        <div className="flex gap-2">
          <button type="button" className="btn-primary flex-1" disabled>
            <CheckCircle2 size={16} aria-hidden="true" /> Ready
          </button>
          <button type="button" className="btn-ghost" onClick={onReset}>
            <RotateCcw size={14} aria-hidden="true" /> Reset
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="btn-primary w-full"
          onClick={onStart}
          disabled={busy}>
          {busy ? (
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          ) : (
            <Download size={16} aria-hidden="true" />
          )}
          {busy ? message || 'Processing…' : label}
        </button>
      )}
    </div>
  );
}
