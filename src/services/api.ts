import {isAudioFormat, parseYouTubeId} from '../lib/utils';
import type {VideoMetadata, DownloadRequest, DownloadStatus} from '../types';

const DEFAULT_API_BASE = 'http://localhost:5000/api/v1';

/** Strip trailing slash so `${API_BASE}/jobs` works for local and hosted env. */
function resolveApiBase(raw: string | undefined): string {
  const value = (raw ?? DEFAULT_API_BASE).trim() || DEFAULT_API_BASE;
  return value.replace(/\/+$/, '');
}

const API_BASE = resolveApiBase(import.meta.env.VITE_API_URL);

export function parseVideoId(input: string): string | null {
  return parseYouTubeId(input);
}

/**
 * Preview metadata only — YouTube oEmbed in the browser.
 * Duration comes from the IFrame player. Does not call the Express API;
 * yt-dlp runs only when the user starts a download.
 */
export async function fetchVideoInfo(url: string): Promise<VideoMetadata> {
  const id = parseVideoId(url);
  if (!id) throw new Error('Invalid YouTube URL');

  const watchUrl = `https://www.youtube.com/watch?v=${id}`;
  const fallback: VideoMetadata = {
    id,
    url: watchUrl,
    title: 'YouTube video',
    duration: 0,
    thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    channel: '',
    availableQualities: ['1080p', '720p', '480p'],
  };

  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`,
    );
    if (!res.ok) return fallback;
    const data = (await res.json()) as {
      title?: string;
      author_name?: string;
    };
    return {
      ...fallback,
      title: data.title?.trim() || fallback.title,
      channel: data.author_name?.trim() || '',
    };
  } catch {
    return fallback;
  }
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

const RATE_LIMIT_TOAST = 'Too many downloads — try again in a few minutes.';

/** Map API start-job failures to a user-facing message (429 → clear rate-limit toast). */
export function formatStartJobError(
  status: number,
  body: {error?: string; message?: string},
  retryAfterHeader: string | null,
): string {
  if (status === 429 || body.error === 'rate_limited') {
    if (retryAfterHeader && /^\d+$/.test(retryAfterHeader.trim())) {
      const seconds = Number(retryAfterHeader.trim());
      if (seconds > 0 && seconds < 7200) {
        const mins = Math.max(1, Math.ceil(seconds / 60));
        return `Too many downloads — try again in about ${mins} minute${mins === 1 ? '' : 's'}.`;
      }
    }
    return RATE_LIMIT_TOAST;
  }
  return body.message || body.error || 'Could not start extract';
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
  let body: JobPublic & {error?: string; message?: string} = {
    id: '',
    cacheKey: '',
    stage: 'error',
    percent: 0,
    message: '',
    cached: false,
  };
  try {
    body = (await res.json()) as JobPublic & {error?: string; message?: string};
  } catch {
    /* non-JSON error body */
  }
  if (!res.ok) {
    throw new Error(
      formatStartJobError(res.status, body, res.headers.get('Retry-After')),
    );
  }
  onProgress(toProgress(body));
  if (body.stage === 'complete' && body.fileUrl) {
    return body.fileUrl;
  }
  return listenJobEvents(body.id, onProgress);
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
