import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Loader2,
  Scissors,
  Keyboard,
  RotateCcw,
  Download as DownloadIcon,
} from 'lucide-react';
import {Header} from './components/layout/Header';
import {Footer} from './components/layout/Footer';
import {UrlInputBar} from './components/controls/UrlInputBar';
import {TimeRangeSlider} from './components/controls/TimeRangeSlider';
import {TimeInputs} from './components/controls/TimeInputs';
import {FormatSelector} from './components/controls/FormatSelector';
import {DirectUrlCard} from './components/controls/DirectUrlCard';
import {ModeToggle} from './components/controls/ModeToggle';
import {PlayerWorkspace} from './components/player/PlayerWorkspace';
import type {PlaybackHandle} from './components/player/OriginalPlayer';
import {ToastStack} from './components/ui/ToastStack';
import {DownloadProgress} from './components/ui/DownloadProgress';
import {useToasts} from './hooks/useToasts';
import {useDownloadJob} from './hooks/useDownloadJob';
import {readUrlParams, useUrlSync} from './hooks/useUrlSync';
import {buildDownloadUrl, fetchVideoInfo} from './services/api';
import {
  AUDIO_BITRATES,
  VIDEO_QUALITIES,
  buildShareUrl,
  clamp,
  defaultQualityFor,
  downloadButtonLabel,
  formatTime,
  isVideoFormat,
  parseMediaFormat,
  parseOperatingMode,
  parsePlayerView,
  parseYouTubeId,
} from './lib/utils';
import type {
  DownloadRequest,
  MediaFormat,
  OperatingMode,
  PlayerView,
  VideoMetadata,
  VideoQuality,
} from './types';

const DEFAULT_CLIP = 30;

function initialWorkspace() {
  const p = readUrlParams();
  const format = parseMediaFormat(p.format);
  return {
    urlInput: p.v ?? '',
    start: p.start ?? 0,
    end: p.end ?? DEFAULT_CLIP,
    format,
    quality: resolveQuality(format, p.quality),
    mode: parseOperatingMode(p.mode),
    view: parsePlayerView(p.view),
    videoHint: p.v,
  };
}

function resolveQuality(format: MediaFormat, quality: string | null): string {
  if (isVideoFormat(format)) {
    return VIDEO_QUALITIES.includes(quality as VideoQuality)
      ? (quality as string)
      : '1080p';
  }
  if (format === 'mp3') {
    return (AUDIO_BITRATES as readonly string[]).includes(quality ?? '')
      ? (quality as string)
      : '320kbps';
  }
  return 'best';
}

const EMPTY_PLAYBACK: PlaybackHandle = {
  currentTime: 0,
  playing: false,
  play: () => {},
  pause: () => {},
};

function App() {
  const boot = useMemo(() => initialWorkspace(), []);
  const {toasts, toast, dismiss} = useToasts();
  const {
    status,
    percent,
    message,
    start: startJob,
    reset: resetJob,
  } = useDownloadJob();
  const [urlInput, setUrlInput] = useState(boot.urlInput);
  const [meta, setMeta] = useState<VideoMetadata | null>(null);
  const [loading, setLoading] = useState(Boolean(boot.videoHint));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [start, setStart] = useState(boot.start);
  const [end, setEnd] = useState(boot.end);
  const [duration, setDuration] = useState(0);
  const [format, setFormat] = useState<MediaFormat>(boot.format);
  const [quality, setQuality] = useState(boot.quality);
  const [mode, setMode] = useState<OperatingMode>(boot.mode);
  const [view, setView] = useState<PlayerView>(boot.view);
  const [playhead, setPlayhead] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const playbackRef = useRef<PlaybackHandle>(EMPTY_PLAYBACK);
  const booted = useRef(false);

  const handleLoad = useCallback(
    async (raw: string, preserveRange = false) => {
      const id = parseYouTubeId(raw);
      if (!id) {
        setLoadError("That doesn't look like a valid YouTube link.");
        toast('Could not parse that URL', 'error');
        return;
      }
      setUrlInput(raw);
      setLoadError(null);
      setLoading(true);
      resetJob();
      try {
        const info = await fetchVideoInfo(raw);
        setMeta(info);
        if (!preserveRange) {
          setStart(0);
          setEnd(DEFAULT_CLIP);
        }
      } catch {
        setMeta(null);
        setLoadError('Could not load video metadata.');
        toast('Could not load video', 'error');
      } finally {
        setLoading(false);
      }
    },
    [toast, resetJob],
  );

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    if (boot.videoHint) void handleLoad(boot.videoHint, true);
  }, [boot.videoHint, handleLoad]);

  const syncId = meta?.id ?? boot.videoHint ?? null;
  useUrlSync({
    v: syncId,
    start: syncId && mode === 'clip' ? start : null,
    end: syncId && mode === 'clip' ? end : null,
    format: syncId ? format : null,
    quality: syncId ? quality : null,
    mode: syncId ? mode : null,
    view: syncId && mode === 'clip' ? view : null,
  });

  const handleRangeChange = useCallback((s: number, e: number) => {
    setStart(Math.round(s));
    setEnd(Math.round(e));
  }, []);

  const handleDuration = useCallback(
    (d: number) => {
      const length = Math.max(0, Math.round(d));
      setDuration(length);
      if (mode === 'full') {
        setStart(0);
        setEnd(length);
        return;
      }
      setStart(s => clamp(Math.round(s), 0, Math.max(0, length - 1)));
      setEnd(e => {
        const next = Math.round(e);
        if (next <= 0) return Math.min(DEFAULT_CLIP, length) || length;
        return clamp(next, 1, length || next);
      });
    },
    [mode],
  );

  const handleCopy = useCallback(
    (message: string) => {
      toast(message, 'success');
    },
    [toast],
  );

  const markStart = useCallback(
    (t: number) => {
      setStart(clamp(Math.round(t), 0, end - 1));
      toast('Start set to current position', 'success');
    },
    [end, toast],
  );
  const markEnd = useCallback(
    (t: number) => {
      setEnd(clamp(Math.round(t), start + 1, duration || Math.round(t)));
      toast('End set to current position', 'success');
    },
    [start, duration, toast],
  );

  const resetClip = useCallback(() => {
    setStart(0);
    setEnd(
      mode === 'full'
        ? duration || DEFAULT_CLIP
        : Math.min(DEFAULT_CLIP, duration) || DEFAULT_CLIP,
    );
    toast('Range reset', 'info');
  }, [duration, mode, toast]);

  const onPlayback = useCallback((handle: PlaybackHandle) => {
    playbackRef.current = handle;
    setPlayhead(handle.currentTime);
  }, []);

  const changeMode = useCallback(
    (next: OperatingMode) => {
      setMode(next);
      if (next === 'full') {
        setStart(0);
        setEnd(duration > 0 ? duration : DEFAULT_CLIP);
      } else {
        setStart(0);
        setEnd(Math.min(DEFAULT_CLIP, duration) || DEFAULT_CLIP);
      }
    },
    [duration],
  );

  const changeFormat = useCallback((next: MediaFormat, nextQuality: string) => {
    setFormat(next);
    setQuality(nextQuality || defaultQualityFor(next));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!meta) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        const p = playbackRef.current;
        if (p.playing) p.pause();
        else p.play();
        return;
      }
      if (e.key === '[') {
        markStart(playbackRef.current.currentTime);
        return;
      }
      if (e.key === ']') {
        markEnd(playbackRef.current.currentTime);
        return;
      }
      if (e.key === 'r' || e.key === 'R') resetClip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [meta, markStart, markEnd, resetClip]);

  const prevStatus = useRef(status);
  useEffect(() => {
    if (prevStatus.current === status) return;
    prevStatus.current = status;
    if (status === 'complete') toast('Download ready', 'success');
    if (status === 'error') toast(message || 'Download failed', 'error');
  }, [status, message, toast]);

  const request: DownloadRequest | null = useMemo(() => {
    if (!meta) return null;
    return {
      url: meta.url,
      format,
      quality,
      ...(mode === 'clip' ? {start, end} : {}),
    };
  }, [meta, format, quality, mode, start, end]);

  const downloadUrl = request ? buildDownloadUrl(request) : '';
  const shareUrl = meta
    ? buildShareUrl({
        videoId: meta.id,
        start,
        end,
        format,
        quality,
        mode,
        view,
      })
    : '';

  const busy =
    status === 'queued' || status === 'downloading' || status === 'merging';
  const clipLen = Math.max(0, Math.round(end - start));
  const downloadLabel = downloadButtonLabel({
    mode,
    format,
    start,
    end,
    duration,
  });

  return (
    <div className="flex min-h-full flex-col">
      <a
        href="#main-content"
        className="bg-brand-500 sr-only z-50 rounded-lg px-3 py-2 text-sm font-semibold text-white focus:not-sr-only focus:absolute focus:top-3 focus:left-3">
        Skip to content
      </a>
      <Header />
      <main
        id="main-content"
        className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <section className="animate-fade-in mx-auto mb-8 max-w-2xl text-center">
          <h1 className="mb-2.5 text-3xl font-bold tracking-tight sm:text-4xl">
            Trim, preview, and download any{' '}
            <span className="from-brand-500 to-accent-400 bg-linear-to-r bg-clip-text text-transparent">
              YouTube clip
            </span>
          </h1>
          <p className="text-ink-300 mb-6 text-sm sm:text-base">
            Full-video extract or precision slice. Dual players, shareable
            workspace URLs, and a copyable download endpoint.
          </p>
          <UrlInputBar
            onSubmit={url => void handleLoad(url)}
            loading={loading}
            initialValue={urlInput}
            invalid={Boolean(loadError)}
            errorId={loadError ? 'url-error' : undefined}
          />
          {loadError && (
            <p
              id="url-error"
              role="alert"
              className="text-err-500 mt-2 text-left text-xs">
              {loadError}
            </p>
          )}
        </section>

        {loading && (
          <p
            role="status"
            className="text-ink-400 flex flex-col items-center justify-center py-20">
            <Loader2
              size={32}
              className="text-brand-500 mb-3 animate-spin"
              aria-hidden="true"
            />
            <span className="text-sm">Loading video…</span>
          </p>
        )}

        {!loading && !meta && <EmptyState />}

        {!loading && meta && (
          <div className="animate-fade-in space-y-6">
            <PlayerWorkspace
              videoId={meta.id}
              start={start}
              end={end}
              mode={mode}
              view={view}
              onViewChange={setView}
              onMarkStart={markStart}
              onMarkEnd={markEnd}
              onDuration={handleDuration}
              onPlayback={onPlayback}
            />

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-5">
                <section className="glass flex items-center gap-3 rounded-2xl p-4">
                  <img
                    src={meta.thumbnailUrl}
                    alt=""
                    className="h-12 w-20 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
                  />
                  <div className="min-w-0">
                    <h2 className="text-ink-100 truncate text-sm font-semibold">
                      {meta.title}
                    </h2>
                    {meta.channel && (
                      <p className="text-ink-400 truncate text-xs">
                        {meta.channel}
                      </p>
                    )}
                  </div>
                  {mode === 'clip' && (
                    <span className="chip border-brand-500/30 bg-brand-500/10 text-ink-100 shrink-0">
                      {formatTime(clipLen)}
                    </span>
                  )}
                </section>

                <section
                  aria-labelledby="mode-heading"
                  className="glass space-y-3 rounded-2xl p-5">
                  <h2 id="mode-heading" className="text-sm font-semibold">
                    Operating mode
                  </h2>
                  <ModeToggle value={mode} onChange={changeMode} />
                </section>

                {mode === 'clip' && (
                  <section
                    aria-labelledby="trim-heading"
                    className="glass space-y-4 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Scissors
                          size={16}
                          className="text-brand-500"
                          aria-hidden="true"
                        />
                        <h2 id="trim-heading" className="text-sm font-semibold">
                          Trim range
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={resetClip}
                        className="btn-ghost px-3! py-1.5! text-xs">
                        <RotateCcw size={13} aria-hidden="true" /> Reset
                      </button>
                    </div>
                    <TimeRangeSlider
                      duration={
                        duration > 0 ? duration : Math.max(end, DEFAULT_CLIP)
                      }
                      start={start}
                      end={end}
                      onChange={handleRangeChange}
                      playhead={playhead}
                      disabled={false}
                    />
                    <TimeInputs
                      duration={duration}
                      start={start}
                      end={end}
                      onChange={handleRangeChange}
                    />
                  </section>
                )}
              </div>

              <div className="space-y-5">
                <section
                  aria-labelledby="format-heading"
                  className="glass space-y-3 rounded-2xl p-5">
                  <h2 id="format-heading" className="text-sm font-semibold">
                    Media format
                  </h2>
                  <FormatSelector
                    format={format}
                    quality={quality}
                    onChange={changeFormat}
                  />
                </section>

                <section
                  aria-labelledby="download-heading"
                  className="glass space-y-3 rounded-2xl p-5">
                  <div className="flex items-center gap-2">
                    <DownloadIcon
                      size={16}
                      className="text-accent-400"
                      aria-hidden="true"
                    />
                    <h2 id="download-heading" className="text-sm font-semibold">
                      Download
                    </h2>
                  </div>
                  <DownloadProgress
                    status={status}
                    percent={percent}
                    message={message}
                    busy={busy}
                    label={downloadLabel}
                    onStart={() => {
                      if (!request) return;
                      void startJob(request);
                    }}
                    onReset={resetJob}
                  />
                </section>

                <section
                  aria-labelledby="api-url-heading"
                  className="glass space-y-3 rounded-2xl p-5">
                  <h2 id="api-url-heading" className="text-sm font-semibold">
                    Direct API URL
                  </h2>
                  <DirectUrlCard
                    downloadUrl={downloadUrl}
                    shareUrl={shareUrl}
                    onCopy={handleCopy}
                  />
                </section>

                <button
                  type="button"
                  onClick={() => setShowHelp(s => !s)}
                  className="glass flex w-full items-center justify-between rounded-2xl p-4 text-left transition hover:bg-white/4"
                  aria-expanded={showHelp}
                  aria-controls="shortcut-help">
                  <span className="text-ink-300 flex items-center gap-2 text-sm">
                    <Keyboard size={16} aria-hidden="true" /> Keyboard shortcuts
                  </span>
                  <span className="text-ink-400 text-xs">
                    {showHelp ? 'Hide' : 'Show'}
                  </span>
                </button>
                {showHelp && (
                  <dl
                    id="shortcut-help"
                    className="glass animate-fade-in space-y-2 rounded-2xl p-4 text-xs">
                    <Shortcut keys="Space" desc="Play / pause original" />
                    <Shortcut keys="[" desc="Set start at playhead" />
                    <Shortcut keys="]" desc="Set end at playhead" />
                    <Shortcut keys="R" desc="Reset range" />
                  </dl>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

function EmptyState() {
  return (
    <section
      aria-labelledby="empty-heading"
      className="animate-fade-in flex flex-col items-center justify-center py-16 text-center">
      <div
        className="from-brand-500/20 to-accent-400/10 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br ring-1 ring-white/5"
        aria-hidden="true">
        <Scissors size={28} className="text-brand-500" />
      </div>
      <h2
        id="empty-heading"
        className="text-ink-100 mb-1 text-lg font-semibold">
        No video loaded
      </h2>
      <p className="text-ink-400 max-w-sm text-sm">
        Paste a YouTube URL above to start. Use Full Video for a one-click
        extract, or Precision Clip to slice start and end before downloading.
      </p>
    </section>
  );
}

function Shortcut({keys, desc}: {keys: string; desc: string}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-300">{desc}</dt>
      <dd className="m-0">
        <kbd className="bg-ink-800 text-ink-200 rounded border border-white/10 px-2 py-0.5 font-mono text-[11px]">
          {keys}
        </kbd>
      </dd>
    </div>
  );
}

export default App;
