import {useEffect, useState} from 'react';
import {Search, Loader2, X} from 'lucide-react';
import {cn} from '../../lib/utils';

interface Props {
  onSubmit: (url: string) => void;
  /** Clears the field and resets the loaded workspace (players, clip, job). */
  onClear?: () => void;
  loading: boolean;
  initialValue?: string;
  invalid?: boolean;
  errorId?: string;
}

export function UrlInputBar({
  onSubmit,
  onClear,
  loading,
  initialValue = '',
  invalid = false,
  errorId,
}: Props) {
  const [value, setValue] = useState(initialValue);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const submit = (e: {preventDefault: () => void}) => {
    e.preventDefault();
    if (value.trim()) onSubmit(value.trim());
  };

  const clear = () => {
    setValue('');
    onClear?.();
  };

  return (
    <form onSubmit={submit} className="relative w-full">
      <div
        className={cn(
          'glass-strong flex items-center gap-2 rounded-2xl py-2 pr-2 pl-4 transition-all duration-300',
          focused
            ? 'ring-brand-500/50 shadow-glow ring-2'
            : 'ring-1 ring-white/5',
        )}>
        <Search
          size={18}
          aria-hidden="true"
          className={cn(
            'shrink-0 transition',
            focused ? 'text-brand-500' : 'text-ink-400',
          )}
        />
        <input
          value={value}
          onChange={e => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Paste a YouTube link or video ID…"
          aria-label="YouTube URL"
          aria-invalid={invalid || undefined}
          aria-describedby={errorId}
          className="text-ink-100 placeholder:text-ink-400 flex-1 bg-transparent py-1.5 text-sm outline-none"
          spellCheck={false}
          autoComplete="off"
          enterKeyHint="go"
        />
        {value && !loading && (
          <button
            type="button"
            onClick={clear}
            className="btn-icon text-ink-400 hover:text-ink-100"
            aria-label="Clear and reset workspace">
            <X size={16} aria-hidden="true" />
          </button>
        )}
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="btn-primary shrink-0">
          {loading ? (
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          ) : (
            <Search size={16} aria-hidden="true" />
          )}
          <span className="hidden sm:inline">
            {loading ? 'Loading' : 'Load'}
          </span>
        </button>
      </div>
    </form>
  );
}
