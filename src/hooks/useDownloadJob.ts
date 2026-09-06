import {useCallback, useRef, useState} from 'react';
import {
  startBrowserDownload,
  triggerDownload,
  type DownloadProgress,
} from '../services/api';
import type {DownloadRequest, DownloadStatus} from '../types';

export function useDownloadJob() {
  const [status, setStatus] = useState<DownloadStatus>('idle');
  const [percent, setPercent] = useState(0);
  const [message, setMessage] = useState('');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const start = useCallback(async (params: DownloadRequest) => {
    setStatus('queued');
    setPercent(0);
    setMessage('Queued…');
    setResultUrl(null);
    try {
      const url = await triggerDownload(params, (p: DownloadProgress) => {
        setStatus(p.status);
        setPercent(p.percent);
        setMessage(p.message);
      });
      setResultUrl(url);
      setStatus('complete');
      startBrowserDownload(url);
    } catch (e) {
      setStatus('error');
      setMessage(e instanceof Error ? e.message : 'Download failed');
    }
  }, []);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus('idle');
    setPercent(0);
    setMessage('');
    setResultUrl(null);
  }, []);

  return {status, percent, message, resultUrl, start, reset};
}
