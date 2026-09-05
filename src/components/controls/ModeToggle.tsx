import {Film, Scissors} from 'lucide-react';
import {cn} from '../../lib/utils';
import type {OperatingMode} from '../../types';

const OPTIONS: {
  id: OperatingMode;
  label: string;
  hint: string;
  icon: typeof Film;
}[] = [
  {
    id: 'full',
    label: 'Full Video',
    hint: 'One-click extract',
    icon: Film,
  },
  {
    id: 'clip',
    label: 'Precision Clip',
    hint: 'Slice start → end',
    icon: Scissors,
  },
];

interface Props {
  value: OperatingMode;
  onChange: (mode: OperatingMode) => void;
}

export function ModeToggle({value, onChange}: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Operating mode"
      className="grid grid-cols-2 gap-2">
      {OPTIONS.map(opt => {
        const active = value === opt.id;
        const Icon = opt.icon;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.id)}
            className={cn(
              'rounded-xl border px-3 py-2.5 text-left transition',
              active
                ? 'border-brand-500/50 bg-brand-500/15 ring-brand-500/30 ring-1'
                : 'border-white/5 bg-white/5 hover:bg-white/10',
            )}>
            <span className="text-ink-100 flex items-center gap-1.5 text-sm font-semibold">
              <Icon size={14} aria-hidden="true" />
              {opt.label}
            </span>
            <span className="text-ink-400 mt-0.5 block text-xs">
              {opt.hint}
            </span>
          </button>
        );
      })}
    </div>
  );
}
