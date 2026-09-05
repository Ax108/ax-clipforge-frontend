import {useEffect, useRef, useState} from 'react';

declare global {
  interface Window {
    YT?: {
      Player: new (id: string, opts: Record<string, unknown>) => YtPlayer;
      PlayerState: {PLAYING: number; PAUSED: number; ENDED: number};
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YtPlayer {
  destroy: () => void;
  getDuration: () => number;
  getCurrentTime: () => number;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (s: number, allowSeekAhead: boolean) => void;
}

let apiPromise: Promise<void> | null = null;

function loadYouTubeAPI(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<void>(resolve => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    document.head.appendChild(tag);
  });
  return apiPromise;
}

export interface PlayerState {
  ready: boolean;
  duration: number;
  currentTime: number;
  playing: boolean;
  play: () => void;
  pause: () => void;
  seekTo: (s: number) => void;
}

export function useYouTubeVideo(
  containerId: string | null,
  videoId: string | null,
  opts: {onEnd?: () => void} = {},
): PlayerState {
  const [ready, setReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const playerRef = useRef<YtPlayer | null>(null);
  const intervalRef = useRef<number | null>(null);
  const onEndRef = useRef(opts.onEnd);

  useEffect(() => {
    onEndRef.current = opts.onEnd;
  }, [opts.onEnd]);

  useEffect(() => {
    if (!containerId || !videoId) return;
    let cancelled = false;

    void loadYouTubeAPI().then(() => {
      if (cancelled || !window.YT) return;
      const el = document.getElementById(containerId);
      if (!el) return;
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          /* noop */
        }
        playerRef.current = null;
      }
      el.innerHTML = '';

      playerRef.current = new window.YT.Player(containerId, {
        videoId,
        playerVars: {rel: 0, modestbranding: 1, playsinline: 1},
        events: {
          onReady: () => {
            if (cancelled) return;
            setReady(true);
            setDuration(playerRef.current?.getDuration() || 0);
            if (intervalRef.current == null) {
              intervalRef.current = window.setInterval(() => {
                if (playerRef.current?.getCurrentTime) {
                  setCurrentTime(playerRef.current.getCurrentTime() || 0);
                }
              }, 200);
            }
          },
          onStateChange: (e: {data: number}) => {
            const YT = window.YT;
            if (!YT) return;
            if (e.data === YT.PlayerState.PLAYING) {
              setPlaying(true);
              setDuration(d => playerRef.current?.getDuration() || d);
            } else if (e.data === YT.PlayerState.PAUSED) {
              setPlaying(false);
            } else if (e.data === YT.PlayerState.ENDED) {
              setPlaying(false);
              onEndRef.current?.();
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (intervalRef.current != null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          /* noop */
        }
        playerRef.current = null;
      }
      setReady(false);
      setDuration(0);
      setCurrentTime(0);
      setPlaying(false);
    };
  }, [containerId, videoId]);

  return {
    ready,
    duration,
    currentTime,
    playing,
    play: () => playerRef.current?.playVideo?.(),
    pause: () => playerRef.current?.pauseVideo?.(),
    seekTo: (s: number) => playerRef.current?.seekTo?.(s, true),
  };
}
