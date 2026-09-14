import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals';
import {
  buildDownloadUrl,
  fetchVideoInfo,
  formatStartJobError,
  parseVideoId,
  triggerDownload,
} from '../services/api';

describe('parseVideoId', () => {
  it('delegates to parseYouTubeId', () => {
    expect(parseVideoId('https://youtu.be/dQw4w9wgGcQ')).toBe('dQw4w9wgGcQ');
  });
});

describe('fetchVideoInfo', () => {
  const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('rejects invalid urls', async () => {
    await expect(fetchVideoInfo('nope')).rejects.toThrow('Invalid YouTube URL');
  });

  it('loads title/channel from YouTube oEmbed (not the Express API)', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        title: 'Never Gonna Give You Up',
        author_name: 'Rick',
      }),
    } as Response);

    const meta = await fetchVideoInfo('https://youtu.be/dQw4w9wgGcQ');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('youtube.com/oembed'),
    );
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/info/),
      expect.anything(),
    );
    expect(meta.id).toBe('dQw4w9wgGcQ');
    expect(meta.title).toBe('Never Gonna Give You Up');
    expect(meta.channel).toBe('Rick');
    expect(meta.duration).toBe(0);
    expect(meta.thumbnailUrl).toContain('dQw4w9wgGcQ');
  });

  it('still opens the workspace when oEmbed fails', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response);

    const meta = await fetchVideoInfo('dQw4w9wgGcQ');
    expect(meta.id).toBe('dQw4w9wgGcQ');
    expect(meta.title).toBe('YouTube video');
    expect(meta.duration).toBe(0);
  });
});

describe('buildDownloadUrl / triggerDownload', () => {
  const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('encodes clip bounds on the download url', () => {
    const url = buildDownloadUrl({
      url: 'https://youtu.be/dQw4w9wgGcQ',
      format: 'mp4',
      quality: '720p',
      start: 1.9,
      end: 10.2,
    });
    expect(url).toContain('/api/v1/download');
    expect(url).toContain('format=mp4');
    expect(url).toContain('quality=720p');
    expect(url).toContain('start=1');
    expect(url).toContain('end=10');
  });

  it('uses the dedicated audio extract path for mp3/m4a/flac', () => {
    const url = buildDownloadUrl({
      url: 'https://youtu.be/dQw4w9wgGcQ',
      format: 'mp3',
      quality: '320kbps',
    });
    expect(url).toContain('/api/v1/audio?');
    expect(url).not.toContain('/api/v1/download');
    expect(url).toContain('format=mp3');
    expect(url).toContain('quality=320kbps');
  });

  it('returns the cached file url when POST /jobs is already complete', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'job-1',
        cacheKey: 'dQw4w9wgGcQ_mp4_1080p_full',
        stage: 'complete',
        percent: 100,
        message: 'Using cached extract',
        cached: true,
        fileUrl: 'http://localhost:5000/api/v1/jobs/job-1/file',
      }),
    } as Response);

    const statuses: string[] = [];
    const result = await triggerDownload(
      {
        url: 'https://youtu.be/dQw4w9wgGcQ',
        format: 'mp4',
        quality: '1080p',
      },
      p => {
        statuses.push(p.status);
      },
    );
    expect(result).toContain('/api/v1/jobs/job-1/file');
    expect(statuses).toContain('complete');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/jobs$/),
      expect.objectContaining({method: 'POST'}),
    );
  });

  it('starts audio extracts on POST /audio/jobs', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'job-audio',
        cacheKey: 'dQw4w9wgGcQ_mp3_320kbps_full',
        stage: 'complete',
        percent: 100,
        message: 'Using cached extract',
        cached: true,
        fileUrl: 'http://localhost:5000/api/v1/jobs/job-audio/file',
      }),
    } as Response);

    const result = await triggerDownload(
      {
        url: 'https://youtu.be/dQw4w9wgGcQ',
        format: 'mp3',
        quality: '320kbps',
      },
      () => {},
    );
    expect(result).toContain('/api/v1/jobs/job-audio/file');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/audio/jobs'),
      expect.objectContaining({method: 'POST'}),
    );
  });

  it('throws a clear toast message when the API returns 429', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 429,
      headers: {get: (name: string) => (name === 'Retry-After' ? '120' : null)},
      json: async () => ({
        error: 'rate_limited',
        message: 'Too many extract requests from this IP.',
      }),
    } as unknown as Response);

    await expect(
      triggerDownload(
        {
          url: 'https://youtu.be/dQw4w9wgGcQ',
          format: 'mp4',
          quality: '1080p',
        },
        () => {},
      ),
    ).rejects.toThrow('Too many downloads — try again in about 2 minutes.');
  });
});

describe('formatStartJobError', () => {
  it('uses a friendly default for rate_limited without Retry-After', () => {
    expect(formatStartJobError(429, {error: 'rate_limited'}, null)).toBe(
      'Too many downloads — try again in a few minutes.',
    );
  });

  it('passes through other API errors', () => {
    expect(
      formatStartJobError(503, {message: 'yt-dlp is not installed'}, null),
    ).toBe('yt-dlp is not installed');
  });
});
