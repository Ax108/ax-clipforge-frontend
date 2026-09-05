import {clsx, type ClassValue} from 'clsx';
import {twMerge} from 'tailwind-merge';
import type {
  EmbedUrlOptions,
  MediaFormat,
  OperatingMode,
  PlayerView,
  VideoQuality,
} from '../types';

export const VIDEO_QUALITIES: VideoQuality[] = ['1080p', '720p', '480p'];
export const AUDIO_FORMATS: MediaFormat[] = ['mp3', 'm4a', 'flac'];
export const AUDIO_BITRATES = ['320kbps', '256kbps', '128kbps'] as const;

const YT_HOST_RE =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/|live\/)|youtu\.be\/)([\w-]{11})/;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) seconds = 0;
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

export function parseTimeToSeconds(value: string): number | null {
  if (!value) return null;
  const v = value.trim();
  if (/^\d+(\.\d+)?$/.test(v)) return parseFloat(v);
  const parts = v.split(':').map(p => p.trim());
  if (parts.some(p => p === '' || !/^\d+(\.\d+)?$/.test(p))) return null;
  let secs = 0;
  for (const part of parts) secs = secs * 60 + parseFloat(part);
  return secs;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function parseYouTubeId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  const m = trimmed.match(YT_HOST_RE);
  if (m) return m[1];
  try {
    const url = new URL(
      trimmed.startsWith('http') ? trimmed : `https://${trimmed}`,
    );
    if (url.hostname.includes('youtube.com')) {
      const v = url.searchParams.get('v');
      if (v && /^[\w-]{11}$/.test(v)) return v;
    }
  } catch {
    /* not a url */
  }
  return null;
}

export function buildEmbedUrl({
  videoId,
  start,
  end,
  format,
  autoplay = false,
  mute = false,
}: EmbedUrlOptions): string {
  const params = new URLSearchParams({
    start: String(Math.max(0, Math.floor(start))),
    end: String(Math.max(0, Math.floor(end))),
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
  });
  if (autoplay) params.set('autoplay', '1');
  if (mute) params.set('mute', '1');
  if (format === 'loop') {
    params.set('loop', '1');
    params.set('playlist', videoId);
  }
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

export function parseMediaFormat(
  value: string | null | undefined,
): MediaFormat {
  if (
    value === 'mp3' ||
    value === 'm4a' ||
    value === 'flac' ||
    value === 'mp4'
  ) {
    return value;
  }
  return 'mp4';
}

export function parseOperatingMode(
  value: string | null | undefined,
): OperatingMode {
  return value === 'full' ? 'full' : 'clip';
}

export function parsePlayerView(value: string | null | undefined): PlayerView {
  return value === 'focus' ? 'focus' : 'split';
}

export function isVideoFormat(format: MediaFormat): boolean {
  return format === 'mp4';
}

export function defaultQualityFor(format: MediaFormat): string {
  return isVideoFormat(format) ? '1080p' : '320kbps';
}

export function downloadButtonLabel(opts: {
  mode: OperatingMode;
  format: MediaFormat;
  start: number;
  end: number;
  duration: number;
}): string {
  const media = opts.format.toUpperCase();
  if (opts.mode === 'full') {
    return opts.duration > 0
      ? `Download full ${media} (${formatTime(opts.duration)})`
      : `Download full ${media}`;
  }
  const clipLen = Math.max(0, Math.round(opts.end - opts.start));
  return `Download ${formatTime(clipLen)} ${media} clip`;
}

export function buildShareUrl(opts: {
  videoId: string;
  start: number;
  end: number;
  format?: MediaFormat;
  quality?: string;
  mode?: OperatingMode;
  view?: PlayerView;
}): string {
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('v', opts.videoId);
  url.searchParams.set('start', String(Math.floor(opts.start)));
  url.searchParams.set('end', String(Math.floor(opts.end)));
  if (opts.format) url.searchParams.set('format', opts.format);
  if (opts.quality) url.searchParams.set('quality', opts.quality);
  if (opts.mode) url.searchParams.set('mode', opts.mode);
  if (opts.view) url.searchParams.set('view', opts.view);
  return url.toString();
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
