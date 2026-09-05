import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals';
import {
  buildDownloadUrl,
  fetchVideoInfo,
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
    jest.useFakeTimers();
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('rejects invalid urls', async () => {
    await expect(fetchVideoInfo('nope')).rejects.toThrow('Invalid YouTube URL');
  });

  it('returns oEmbed metadata when fetch succeeds', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        title: 'Never Gonna Give You Up',
        author_name: 'Rick',
      }),
    } as Response);

    const pending = fetchVideoInfo('https://youtu.be/dQw4w9wgGcQ');
    await jest.advanceTimersByTimeAsync(500);
    const meta = await pending;

    expect(meta.id).toBe('dQw4w9wgGcQ');
    expect(meta.title).toBe('Never Gonna Give You Up');
    expect(meta.channel).toBe('Rick');
    expect(meta.thumbnailUrl).toContain('dQw4w9wgGcQ');
  });

  it('keeps defaults when oEmbed fails', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    const pending = fetchVideoInfo('dQw4w9wgGcQ');
    await jest.advanceTimersByTimeAsync(500);
    const meta = await pending;

    expect(meta.title).toBe('YouTube video');
    expect(meta.channel).toBe('');
  });
});

describe('buildDownloadUrl / triggerDownload', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
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

  it('walks progress statuses then returns a download url', async () => {
    const statuses: string[] = [];
    const pending = triggerDownload(
      {
        url: 'https://youtu.be/dQw4w9wgGcQ',
        format: 'mp4',
        quality: '1080p',
      },
      p => {
        statuses.push(p.status);
      },
    );
    await jest.runAllTimersAsync();
    const result = await pending;
    expect(result).toContain('/api/v1/download');
    expect(statuses).toContain('queued');
    expect(statuses).toContain('slicing');
    expect(statuses).toContain('downloading');
    expect(statuses).toContain('complete');
  });
});
