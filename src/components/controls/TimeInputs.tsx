import {useEffect, useState} from 'react';
import {clamp, formatTime, parseTimeToSeconds} from '../../lib/utils';

interface Props {
  duration: number;
  start: number;
  end: number;
  onChange: (start: number, end: number) => void;
}

export function TimeInputs({duration, start, end, onChange}: Props) {
  const [startText, setStartText] = useState(formatTime(start));
  const [endText, setEndText] = useState(formatTime(end));

  useEffect(() => {
    setStartText(formatTime(start));
  }, [start]);

  useEffect(() => {
    setEndText(formatTime(end));
  }, [end]);

  const commitStart = () => {
    const parsed = parseTimeToSeconds(startText);
    if (parsed == null) {
      setStartText(formatTime(start));
      return;
    }
    const cap = duration > 0 ? Math.min(end - 1, duration) : end - 1;
    onChange(Math.round(clamp(parsed, 0, Math.max(0, cap))), end);
  };

  const commitEnd = () => {
    const parsed = parseTimeToSeconds(endText);
    if (parsed == null) {
      setEndText(formatTime(end));
      return;
    }
    const cap = duration > 0 ? duration : parsed;
    onChange(start, Math.round(clamp(parsed, start + 1, cap)));
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <label className="block">
        <span className="text-ink-400 mb-1.5 block text-[11px] font-medium tracking-wide uppercase">
          Start
        </span>
        <input
          className="input w-full font-mono"
          value={startText}
          spellCheck={false}
          autoComplete="off"
          inputMode="numeric"
          aria-label="Clip start time"
          onChange={e => setStartText(e.target.value)}
          onBlur={commitStart}
          onKeyDown={e => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
        />
      </label>
      <label className="block">
        <span className="text-ink-400 mb-1.5 block text-[11px] font-medium tracking-wide uppercase">
          End
        </span>
        <input
          className="input w-full font-mono"
          value={endText}
          spellCheck={false}
          autoComplete="off"
          inputMode="numeric"
          aria-label="Clip end time"
          onChange={e => setEndText(e.target.value)}
          onBlur={commitEnd}
          onKeyDown={e => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
        />
      </label>
    </div>
  );
}
