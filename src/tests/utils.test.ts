import {describe, expect, it} from '@jest/globals';
import {
  buildEmbedUrl,
  buildShareUrl,
  clamp,
  defaultQualityFor,
  downloadButtonLabel,
  formatTime,
  parseMediaFormat,
  parseOperatingMode,
  parsePlayerView,
  parseTimeToSeconds,
  parseYouTubeId,
} from '../lib/utils';

describe('parseYouTubeId', () => {
  it('accepts a raw 11-character id', () => {
    expect(parseYouTubeId('dQw4w9wgGcQ')).toBe('dQw4w9wgGcQ');
  });

  it('parses watch, short, and embed urls', () => {
    expect(parseYouTubeId('https://www.youtube.com/watch?v=dQw4w9wgGcQ')).toBe(
      'dQw4w9wgGcQ',
    );
    expect(parseYouTubeId('https://youtu.be/dQw4w9wgGcQ')).toBe('dQw4w9wgGcQ');
    expect(parseYouTubeId('https://www.youtube.com/embed/dQw4w9wgGcQ')).toBe(
      'dQw4w9wgGcQ',
    );
  });

  it('returns null for empty or invalid input', () => {
    expect(parseYouTubeId('')).toBeNull();
    expect(parseYouTubeId('nope')).toBeNull();
  });
});

describe('formatTime / parseTimeToSeconds', () => {
  it('formats seconds as mm:ss and hh:mm:ss', () => {
    expect(formatTime(5)).toBe('00:05');
    expect(formatTime(75)).toBe('01:15');
    expect(formatTime(3661)).toBe('01:01:01');
  });

  it('parses decimal seconds and colon timestamps', () => {
    expect(parseTimeToSeconds('12.5')).toBe(12.5);
    expect(parseTimeToSeconds('1:02')).toBe(62);
    expect(parseTimeToSeconds('1:02:03')).toBe(3723);
    expect(parseTimeToSeconds('')).toBeNull();
    expect(parseTimeToSeconds('1:xx')).toBeNull();
  });
});

describe('clamp', () => {
  it('clamps to the inclusive range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });
});

describe('buildEmbedUrl', () => {
  it('includes start, end, and loop playlist when requested', () => {
    const url = buildEmbedUrl({
      videoId: 'dQw4w9wgGcQ',
      start: 3.9,
      end: 12.2,
      format: 'loop',
      autoplay: true,
      mute: true,
    });
    expect(url).toContain('youtube-nocookie.com/embed/dQw4w9wgGcQ');
    expect(url).toContain('start=3');
    expect(url).toContain('end=12');
    expect(url).toContain('loop=1');
    expect(url).toContain('playlist=dQw4w9wgGcQ');
    expect(url).toContain('autoplay=1');
    expect(url).toContain('mute=1');
  });
});

describe('buildShareUrl', () => {
  it('writes v/start/end onto the current origin path', () => {
    const url = buildShareUrl({
      videoId: 'dQw4w9wgGcQ',
      start: 4,
      end: 20,
      format: 'mp4',
      quality: '720p',
      mode: 'clip',
    });
    expect(url).toContain('v=dQw4w9wgGcQ');
    expect(url).toContain('start=4');
    expect(url).toContain('end=20');
    expect(url).toContain('format=mp4');
    expect(url).toContain('quality=720p');
    expect(url).toContain('mode=clip');
  });
});

describe('media param parsers', () => {
  it('normalizes format, mode, and view', () => {
    expect(parseMediaFormat('mp3')).toBe('mp3');
    expect(parseMediaFormat('nope')).toBe('mp4');
    expect(parseOperatingMode('full')).toBe('full');
    expect(parseOperatingMode(null)).toBe('clip');
    expect(parsePlayerView('focus')).toBe('focus');
    expect(defaultQualityFor('flac')).toBe('best');
    expect(defaultQualityFor('m4a')).toBe('best');
    expect(defaultQualityFor('mp3')).toBe('320kbps');
    expect(defaultQualityFor('mp4')).toBe('1080p');
  });
});

describe('downloadButtonLabel', () => {
  it('uses clip length in precision mode and full duration in full mode', () => {
    expect(
      downloadButtonLabel({
        mode: 'clip',
        format: 'mp4',
        start: 0,
        end: 30,
        duration: 180,
      }),
    ).toBe('Download 00:30 MP4 clip');
    expect(
      downloadButtonLabel({
        mode: 'clip',
        format: 'mp3',
        start: 8,
        end: 40,
        duration: 180,
      }),
    ).toBe('Download 00:32 MP3 clip');
    expect(
      downloadButtonLabel({
        mode: 'full',
        format: 'mp4',
        start: 0,
        end: 0,
        duration: 0,
      }),
    ).toBe('Download full MP4');
    expect(
      downloadButtonLabel({
        mode: 'full',
        format: 'mp4',
        start: 0,
        end: 212,
        duration: 212,
      }),
    ).toBe('Download full MP4 (03:32)');
  });
});
