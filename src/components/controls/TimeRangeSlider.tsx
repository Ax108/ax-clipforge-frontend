import {useState} from 'react';
import {clamp, cn} from '../../lib/utils';

const MIN_GAP = 1;

interface Props {
  duration: number;
  start: number;
  end: number;
  onChange: (start: number, end: number) => void;
  playhead?: number;
  disabled?: boolean;
}

export function TimeRangeSlider({
  duration,
  start,
  end,
  onChange,
  playhead,
  disabled = false,
}: Props) {
  const max = Math.max(duration, end, MIN_GAP);
  const startPct = (start / max) * 100;
  const endPct = (end / max) * 100;
  const playPct =
    playhead != null
      ? Math.min(100, Math.max(0, (playhead / max) * 100))
      : null;
  const [active, setActive] = useState<'start' | 'end' | null>(null);

  const setStart = (next: number) => {
    onChange(clamp(Math.round(next), 0, end - MIN_GAP), end);
  };
  const setEnd = (next: number) => {
    onChange(start, clamp(Math.round(next), start + MIN_GAP, max));
  };

  return (
    <div
      className={cn(
        'relative h-8',
        disabled && 'pointer-events-none opacity-50',
      )}
      role="group"
      aria-label="Clip range"
      onPointerDown={e => {
        if (disabled) return;
        if ((e.target as HTMLElement).tagName === 'INPUT') return;
        const rect = e.currentTarget.getBoundingClientRect();
        const t = ((e.clientX - rect.left) / rect.width) * max;
        if (Math.abs(t - start) <= Math.abs(t - end)) {
          setActive('start');
          setStart(t);
        } else {
          setActive('end');
          setEnd(t);
        }
      }}>
      <div className="bg-ink-700 pointer-events-none absolute top-1/2 right-0 left-0 h-1.5 -translate-y-1/2 rounded-full" />
      <div
        className="bg-brand-500/80 pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full"
        style={{
          left: `${startPct}%`,
          width: `${Math.max(0, endPct - startPct)}%`,
        }}
      />
      {playPct != null && (
        <div
          className="bg-accent-400 pointer-events-none absolute top-1/2 h-3 w-0.5 -translate-y-1/2"
          style={{left: `${playPct}%`}}
        />
      )}
      <input
        type="range"
        className={cn(
          'cf-range absolute inset-0 h-full w-full',
          active === 'start' ? 'z-30' : 'z-10',
        )}
        min={0}
        max={max}
        step={1}
        value={start}
        disabled={disabled}
        aria-valuemin={0}
        aria-valuemax={end - MIN_GAP}
        aria-valuenow={start}
        aria-label="Clip start"
        onPointerDown={() => setActive('start')}
        onChange={e => setStart(Number(e.target.value))}
      />
      <input
        type="range"
        className={cn(
          'cf-range absolute inset-0 h-full w-full',
          active === 'end' ? 'z-30' : 'z-20',
        )}
        min={0}
        max={max}
        step={1}
        value={end}
        disabled={disabled}
        aria-valuemin={start + MIN_GAP}
        aria-valuemax={max}
        aria-valuenow={end}
        aria-label="Clip end"
        onPointerDown={() => setActive('end')}
        onChange={e => setEnd(Number(e.target.value))}
      />
    </div>
  );
}
