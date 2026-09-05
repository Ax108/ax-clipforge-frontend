import {Columns2, Focus} from 'lucide-react';
import {cn} from '../../lib/utils';
import type {OperatingMode, PlayerView} from '../../types';
import {CroppedPlayer} from './CroppedPlayer';
import {OriginalPlayer, type PlaybackHandle} from './OriginalPlayer';

interface Props {
  videoId: string;
  start: number;
  end: number;
  mode: OperatingMode;
  view: PlayerView;
  onViewChange: (view: PlayerView) => void;
  onMarkStart: (t: number) => void;
  onMarkEnd: (t: number) => void;
  onDuration: (duration: number) => void;
  onPlayback?: (handle: PlaybackHandle) => void;
}

export function PlayerWorkspace({
  videoId,
  start,
  end,
  mode,
  view,
  onViewChange,
  onMarkStart,
  onMarkEnd,
  onDuration,
  onPlayback,
}: Props) {
  const clip = mode === 'clip';
  const split = !clip || view === 'split';
  const showOriginal = split || !clip;
  const showCropped = clip && (view === 'split' || view === 'focus');

  return (
    <section aria-label="Preview players" className="space-y-3">
      {clip && (
        <div
          role="radiogroup"
          aria-label="Player layout"
          className="flex justify-end gap-1.5">
          <ViewChip
            active={view === 'split'}
            onClick={() => onViewChange('split')}
            icon={Columns2}
            label="Side-by-side"
          />
          <ViewChip
            active={view === 'focus'}
            onClick={() => onViewChange('focus')}
            icon={Focus}
            label="Focus cropped"
          />
        </div>
      )}
      <div
        className={cn(
          'grid gap-4',
          showOriginal && showCropped ? 'lg:grid-cols-2' : 'grid-cols-1',
        )}>
        <div className={cn(!showOriginal && 'hidden')}>
          <OriginalPlayer
            videoId={videoId}
            onMarkStart={onMarkStart}
            onMarkEnd={onMarkEnd}
            onDuration={onDuration}
            onPlayback={onPlayback}
          />
        </div>
        {showCropped && (
          <CroppedPlayer videoId={videoId} start={start} end={end} />
        )}
      </div>
    </section>
  );
}

function ViewChip({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Columns2;
  label: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        'chip cursor-pointer border',
        active
          ? 'border-brand-500/50 bg-brand-500/20 text-ink-100'
          : 'text-ink-300 border-white/5 bg-white/5 hover:bg-white/10',
      )}>
      <Icon size={12} aria-hidden="true" />
      {label}
    </button>
  );
}
