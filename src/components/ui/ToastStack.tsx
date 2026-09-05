import {CircleCheck, CircleX, Info, X} from 'lucide-react';
import {cn} from '../../lib/utils';
import type {ToastMessage} from '../../types';

const KIND_STYLES = {
  info: 'border-white/10',
  success: 'border-ok-500/40',
  error: 'border-err-500/40',
} as const;

const KIND_ICON = {
  info: Info,
  success: CircleCheck,
  error: CircleX,
} as const;

interface Props {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}

export function ToastStack({toasts, onDismiss}: Props) {
  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(100%-2rem,20rem)] flex-col gap-2">
      {toasts.map(toast => {
        const Icon = KIND_ICON[toast.kind];
        return (
          <div
            key={toast.id}
            role="status"
            className={cn(
              'glass-strong animate-slide-up shadow-card pointer-events-auto flex items-start gap-2.5 rounded-xl border p-3',
              KIND_STYLES[toast.kind],
            )}>
            <Icon
              size={16}
              aria-hidden="true"
              className={cn(
                'mt-0.5 shrink-0',
                toast.kind === 'success' && 'text-ok-500',
                toast.kind === 'error' && 'text-err-500',
                toast.kind === 'info' && 'text-brand-400',
              )}
            />
            <p className="text-ink-100 min-w-0 flex-1 text-sm">{toast.text}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="btn-icon text-ink-400 hover:text-ink-100 h-7 w-7"
              aria-label="Dismiss notification">
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
