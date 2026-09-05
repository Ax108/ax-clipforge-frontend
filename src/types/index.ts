export type VideoId = string;

export interface VideoMetadata {
  id: string;
  url: string;
  title: string;
  duration: number;
  thumbnailUrl: string;
  channel: string;
  availableQualities: string[];
}

export interface YouTubeMeta {
  videoId: string;
  title: string;
  author: string;
  thumbnail: string;
  lengthSeconds: number;
}

export type EmbedFormat = 'embed' | 'loop';

export interface DownloadRequest {
  url: string;
  start?: number;
  end?: number;
  format: MediaFormat;
  quality: string;
}

export type DownloadStatus =
  | 'idle'
  | 'queued'
  | 'slicing'
  | 'downloading'
  | 'complete'
  | 'error';

export type MediaFormat = 'mp4' | 'mp3' | 'm4a' | 'flac';

export type VideoQuality = '1080p' | '720p' | '480p';

export type AudioQuality = '320kbps' | '256kbps' | '128kbps';

export type OperatingMode = 'full' | 'clip';

export type PlayerView = 'split' | 'focus';

export interface ClipRange {
  start: number;
  end: number;
}

export interface ToastMessage {
  id: number;
  text: string;
  kind: 'info' | 'success' | 'error';
}

export interface EmbedUrlOptions {
  videoId: string;
  start: number;
  end: number;
  format: EmbedFormat;
  autoplay?: boolean;
  mute?: boolean;
}
