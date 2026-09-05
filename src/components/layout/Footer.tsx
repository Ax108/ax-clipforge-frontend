import {Heart} from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/5">
      <div className="text-ink-400 mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-8 text-xs sm:flex-row sm:px-6">
        <p className="flex items-center gap-1.5">
          Built with{' '}
          <Heart size={12} className="text-brand-500" aria-hidden="true" /> for
          precise clip crafting. Not affiliated with YouTube.
        </p>
        <p>Uses the YouTube IFrame Player API</p>
      </div>
    </footer>
  );
}
