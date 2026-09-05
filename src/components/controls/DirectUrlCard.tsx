import {useId} from 'react';
import {Copy, ExternalLink} from 'lucide-react';
import {copyToClipboard} from '../../lib/utils';

interface Props {
  downloadUrl: string;
  shareUrl: string;
  onCopy: (message: string) => void;
}

async function copy(
  text: string,
  ok: string,
  fail: string,
  onCopy: (m: string) => void,
) {
  const success = await copyToClipboard(text);
  onCopy(success ? ok : fail);
}

export function DirectUrlCard({downloadUrl, shareUrl, onCopy}: Props) {
  return (
    <div className="space-y-3">
      <UrlRow
        label="Direct download API"
        value={downloadUrl}
        onCopy={() =>
          void copy(
            downloadUrl,
            'Download URL copied',
            'Could not copy URL',
            onCopy,
          )
        }
        onOpen={() => window.open(downloadUrl, '_blank', 'noopener')}
      />
      <UrlRow
        label="Workspace share"
        value={shareUrl}
        onCopy={() =>
          void copy(shareUrl, 'Share URL copied', 'Could not copy URL', onCopy)
        }
      />
    </div>
  );
}

function UrlRow({
  label,
  value,
  onCopy,
  onOpen,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  onOpen?: () => void;
}) {
  const id = useId();
  return (
    <div>
      <label
        htmlFor={id}
        className="text-ink-400 mb-1.5 block text-[11px] font-medium tracking-wide uppercase">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          readOnly
          value={value}
          className="input min-w-0 flex-1 truncate font-mono text-xs"
        />
        <button
          type="button"
          onClick={onCopy}
          className="btn-ghost shrink-0 px-3!"
          aria-label={`Copy ${label}`}>
          <Copy size={14} aria-hidden="true" />
        </button>
        {onOpen && (
          <button
            type="button"
            onClick={onOpen}
            className="btn-ghost shrink-0 px-3!"
            aria-label={`Open ${label}`}>
            <ExternalLink size={14} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
