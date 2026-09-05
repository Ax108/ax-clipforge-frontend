import {parseYouTubeId} from '../lib/utils';
import type {VideoMetadata, DownloadRequest, DownloadStatus} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export function parseVideoId(input: string): string | null {
  return parseYouTubeId(input);
}

export async function fetchVideoInfo(url: string): Promise<VideoMetadata> {
  const id = parseVideoId(url);
  if (!id) throw new Error('Invalid YouTube URL');

  await delay(500);

  let title = 'YouTube video';
  let channel = '';
  const duration = 0;

  try {
    const res = await fetch(
      `https://www.youtube-nocookie.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`,
    );
    if (res.ok) {
      const j = await res.json();
      title = j.title || title;
      channel = j.author_name || '';
    }
  } catch {
    /* offline / CORS — keep defaults */
  }

  return {
    id,
    url: `https://www.youtube.com/watch?v=${id}`,
    title,
    duration,
    thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    channel,
    availableQualities: ['1080p', '720p', '480p'],
  };
}

export interface DownloadProgress {
  status: DownloadStatus;
  percent: number;
  message: string;
}

export async function triggerDownload(
  params: DownloadRequest,
  onProgress: (p: DownloadProgress) => void,
): Promise<string> {
  onProgress({status: 'queued', percent: 0, message: 'Queued for processing…'});
  await delay(700);

  onProgress({
    status: 'slicing',
    percent: 25,
    message: 'Slicing clip boundaries…',
  });
  await delay(900);

  onProgress({
    status: 'downloading',
    percent: 60,
    message: 'Extracting media stream…',
  });
  await delay(1000);

  onProgress({status: 'downloading', percent: 85, message: 'Encoding output…'});
  await delay(700);

  onProgress({status: 'complete', percent: 100, message: 'Download ready'});

  return buildDownloadUrl(params);
}

export function buildDownloadUrl(params: DownloadRequest): string {
  const qs = new URLSearchParams({
    url: params.url,
    format: params.format,
    quality: params.quality,
  });
  if (params.start != null) qs.set('start', String(Math.floor(params.start)));
  if (params.end != null) qs.set('end', String(Math.floor(params.end)));
  return `${API_BASE}/download?${qs.toString()}`;
}

export {API_BASE};
