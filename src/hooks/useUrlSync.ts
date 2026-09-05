import {useCallback, useEffect} from 'react';

export interface SyncParams {
  v?: string | null;
  start?: number | null;
  end?: number | null;
  format?: string | null;
  quality?: string | null;
  mode?: string | null;
  view?: string | null;
}

function writeParam(
  url: URL,
  key: string,
  value: string | number | null | undefined,
) {
  if (value == null || value === '') url.searchParams.delete(key);
  else url.searchParams.set(key, String(value));
}

export function useUrlSync({
  v,
  start,
  end,
  format,
  quality,
  mode,
  view,
}: SyncParams) {
  const update = useCallback((p: SyncParams) => {
    const url = new URL(window.location.href);
    writeParam(url, 'v', p.v);
    writeParam(url, 'start', p.start == null ? null : Math.floor(p.start));
    writeParam(url, 'end', p.end == null ? null : Math.floor(p.end));
    writeParam(url, 'format', p.format);
    writeParam(url, 'quality', p.quality);
    writeParam(url, 'mode', p.mode);
    writeParam(url, 'view', p.view);
    window.history.replaceState({}, '', url.toString());
  }, []);

  useEffect(() => {
    update({v, start, end, format, quality, mode, view});
  }, [v, start, end, format, quality, mode, view, update]);

  return update;
}

export function readUrlParams(): {
  v: string | null;
  start: number | null;
  end: number | null;
  format: string | null;
  quality: string | null;
  mode: string | null;
  view: string | null;
} {
  const p = new URLSearchParams(window.location.search);
  return {
    v: p.get('v'),
    start: p.get('start') ? Number(p.get('start')) : null,
    end: p.get('end') ? Number(p.get('end')) : null,
    format: p.get('format'),
    quality: p.get('quality'),
    mode: p.get('mode'),
    view: p.get('view'),
  };
}
