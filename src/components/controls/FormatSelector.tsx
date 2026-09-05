import {Film, Music} from 'lucide-react';
import {
  AUDIO_BITRATES,
  AUDIO_FORMATS,
  VIDEO_QUALITIES,
  cn,
  isVideoFormat,
} from '../../lib/utils';
import type {MediaFormat} from '../../types';

interface Props {
  format: MediaFormat;
  quality: string;
  onChange: (format: MediaFormat, quality: string) => void;
}

export function FormatSelector({format, quality, onChange}: Props) {
  const video = isVideoFormat(format);

  return (
    <div className="space-y-4">
      <fieldset className="m-0 min-w-0 border-0 p-0">
        <legend className="text-ink-400 mb-2 flex items-center gap-1.5 text-[11px] font-medium tracking-wide uppercase">
          <Film size={12} aria-hidden="true" /> Video
        </legend>
        <div
          role="radiogroup"
          aria-label="Video quality"
          className="flex flex-wrap gap-1.5">
          {VIDEO_QUALITIES.map(q => {
            const active = video && quality === q;
            return (
              <button
                key={q}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange('mp4', q)}
                className={chipClass(active)}>
                MP4 {q}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="m-0 min-w-0 border-0 p-0">
        <legend className="text-ink-400 mb-2 flex items-center gap-1.5 text-[11px] font-medium tracking-wide uppercase">
          <Music size={12} aria-hidden="true" /> Audio
        </legend>
        <div
          role="radiogroup"
          aria-label="Audio format"
          className="flex flex-wrap gap-1.5">
          {AUDIO_FORMATS.map(f => {
            const active = format === f;
            return (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() =>
                  onChange(f, f === 'mp3' ? qualityOrBitrate(quality) : 'best')
                }
                className={chipClass(active)}>
                {f.toUpperCase()}
              </button>
            );
          })}
        </div>
        {format === 'mp3' && (
          <div
            role="radiogroup"
            aria-label="MP3 bitrate"
            className="mt-2 flex flex-wrap gap-1.5">
            {AUDIO_BITRATES.map(rate => (
              <button
                key={rate}
                type="button"
                role="radio"
                aria-checked={quality === rate}
                onClick={() => onChange('mp3', rate)}
                className={chipClass(quality === rate)}>
                {rate}
              </button>
            ))}
          </div>
        )}
      </fieldset>
    </div>
  );
}

function qualityOrBitrate(quality: string): string {
  return (AUDIO_BITRATES as readonly string[]).includes(quality)
    ? quality
    : '320kbps';
}

function chipClass(active: boolean) {
  return cn(
    'chip cursor-pointer border',
    active
      ? 'border-brand-500/50 bg-brand-500/20 text-ink-100'
      : 'text-ink-300 border-white/5 bg-white/5 hover:bg-white/10',
  );
}
