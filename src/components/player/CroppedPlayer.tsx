import {buildEmbedUrl} from '../../lib/utils';

interface Props {
  videoId: string;
  start: number;
  end: number;
}

export function CroppedPlayer({videoId, start, end}: Props) {
  const src = buildEmbedUrl({
    videoId,
    start,
    end,
    format: 'loop',
    autoplay: false,
    mute: true,
  });

  return (
    <section
      aria-labelledby="cropped-player-heading"
      className="glass overflow-hidden rounded-2xl">
      <h2
        id="cropped-player-heading"
        className="text-ink-300 px-4 pt-3 text-xs font-medium tracking-wide uppercase">
        Cropped clip
      </h2>
      <div className="bg-ink-950 m-3 mt-2 aspect-video overflow-hidden rounded-xl">
        <iframe
          key={src}
          title="Cropped clip preview"
          src={src}
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </section>
  );
}
