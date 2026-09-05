import {useEffect} from 'react';
import {SkipBack, SkipForward, Pause, Play} from 'lucide-react';
import {useYouTubeVideo} from '../../hooks/useYouTubeVideo';
import {formatTime} from '../../lib/utils';

const CONTAINER_ID = 'cf-original-player';

function isoDuration(seconds: number) {
  return `PT${Math.max(0, Math.floor(seconds))}S`;
}

export interface PlaybackHandle {
  currentTime: number;
  playing: boolean;
  play: () => void;
  pause: () => void;
}

interface Props {
  videoId: string;
  onMarkStart: (t: number) => void;
  onMarkEnd: (t: number) => void;
  onDuration: (duration: number) => void;
  onPlayback?: (handle: PlaybackHandle) => void;
}

export function OriginalPlayer({
  videoId,
  onMarkStart,
  onMarkEnd,
  onDuration,
  onPlayback,
}: Props) {
  const {ready, duration, currentTime, playing, play, pause} = useYouTubeVideo(
    CONTAINER_ID,
    videoId,
  );

  useEffect(() => {
    if (duration > 0) onDuration(duration);
  }, [duration, onDuration]);

  useEffect(() => {
    onPlayback?.({currentTime, playing, play, pause});
  }, [currentTime, playing, play, pause, onPlayback]);

  return (
    <section
      aria-labelledby="original-player-heading"
      className="glass overflow-hidden rounded-2xl">
      <h2
        id="original-player-heading"
        className="text-ink-300 px-4 pt-3 text-xs font-medium tracking-wide uppercase">
        Original
      </h2>
      <div className="bg-ink-950 relative m-3 mt-2 aspect-video overflow-hidden rounded-xl">
        <div className="absolute inset-0">
          <div id={CONTAINER_ID} className="h-full w-full" />
        </div>
        {!ready && (
          <p
            role="status"
            className="text-ink-400 absolute inset-0 flex items-center justify-center text-sm">
            Loading player…
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 pb-3">
        <p className="text-ink-300 font-mono text-xs" aria-live="off">
          <time dateTime={isoDuration(currentTime)}>
            {formatTime(currentTime)}
          </time>
          {duration > 0 && (
            <span className="text-ink-500">
              {' '}
              /{' '}
              <time dateTime={isoDuration(duration)}>
                {formatTime(duration)}
              </time>
            </span>
          )}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-ghost px-3! py-1.5! text-xs"
            onClick={() => onMarkStart(currentTime)}
            title="Mark start ([)">
            <SkipBack size={13} aria-hidden="true" /> Start
          </button>
          <button
            type="button"
            className="btn-icon bg-white/5"
            onClick={() => (playing ? pause() : play())}
            aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? (
              <Pause size={16} aria-hidden="true" />
            ) : (
              <Play size={16} aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            className="btn-ghost px-3! py-1.5! text-xs"
            onClick={() => onMarkEnd(currentTime)}
            title="Mark end (])">
            End <SkipForward size={13} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
