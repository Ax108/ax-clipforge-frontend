import {isAudioFormat, parseYouTubeId} from '../lib/utils';
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
  cached?: boolean;
}

type JobPublic = {
  id: string;
  cacheKey: string;
  stage: 'queued' | 'downloading' | 'merging' | 'complete' | 'error';
  percent: number;
  message: string;
  cached: boolean;
  error?: string;
  filename?: string;
  fileUrl?: string;
};

function toProgress(job: JobPublic): DownloadProgress {
  const status: DownloadStatus =
    job.stage === 'queued'
      ? 'queued'
      : job.stage === 'merging'
        ? 'merging'
        : job.stage === 'complete'
          ? 'complete'
          : job.stage === 'error'
            ? 'error'
            : 'downloading';
  return {
    status,
    percent: Math.round(job.percent),
    message: job.message,
    cached: job.cached,
  };
}

function startJobPath(format: DownloadRequest['format']): string {
  return isAudioFormat(format) ? '/audio/jobs' : '/jobs';
}

function extractUrlPath(format: DownloadRequest['format']): string {
  return isAudioFormat(format) ? '/audio' : '/download';
}

export async function triggerDownload(
  params: DownloadRequest,
  onProgress: (p: DownloadProgress) => void,
): Promise<string> {
  const res = await fetch(`${API_BASE}${startJobPath(params.format)}`, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify(params),
  });
  const job = (await res.json()) as JobPublic & {error?: string};
  if (!res.ok) {
    throw new Error(job.message || job.error || 'Could not start extract');
  }
  onProgress(toProgress(job));
  if (job.stage === 'complete' && job.fileUrl) {
    return job.fileUrl;
  }
  return listenJobEvents(job.id, onProgress);
}

function listenJobEvents(
  jobId: string,
  onProgress: (p: DownloadProgress) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const source = new EventSource(`${API_BASE}/jobs/${jobId}/events`);
    const onProgressEvent = (ev: MessageEvent<string>) => {
      let data: JobPublic;
      try {
        data = JSON.parse(ev.data) as JobPublic;
      } catch {
        return;
      }
      onProgress(toProgress(data));
      if (data.stage === 'complete' && data.fileUrl) {
        source.close();
        resolve(data.fileUrl);
      }
      if (data.stage === 'error') {
        source.close();
        reject(new Error(data.message || 'Download failed'));
      }
    };
    source.addEventListener('progress', onProgressEvent);
    source.onerror = () => {
      void fetch(`${API_BASE}/jobs/${jobId}`)
        .then(async res => {
          if (!res.ok) return;
          const data = (await res.json()) as JobPublic;
          onProgress(toProgress(data));
          if (data.stage === 'complete' && data.fileUrl) {
            source.close();
            resolve(data.fileUrl);
          }
          if (data.stage === 'error') {
            source.close();
            reject(new Error(data.message || 'Download failed'));
          }
        })
        .catch(() => {
          /* EventSource will retry */
        });
    };
  });
}

export function buildDownloadUrl(params: DownloadRequest): string {
  const qs = new URLSearchParams({
    url: params.url,
    format: params.format,
    quality: params.quality,
  });
  if (params.start != null) qs.set('start', String(Math.floor(params.start)));
  if (params.end != null) qs.set('end', String(Math.floor(params.end)));
  return `${API_BASE}${extractUrlPath(params.format)}?${qs.toString()}`;
}

export function startBrowserDownload(fileUrl: string): void {
  if (typeof document === 'undefined') return;
  const a = document.createElement('a');
  a.href = fileUrl;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export {API_BASE};
