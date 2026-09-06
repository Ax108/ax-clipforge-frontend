# ClipForge

Standalone Vite + React frontend for trimming, previewing, and downloading YouTube videos or timestamped clips.

Paste a YouTube URL, choose **Full Video** or **Precision Clip**, preview, then download. In-app Download talks to [https://github.com/Ax108/ax-clipforge-backend](https://github.com/Ax108/ax-clipforge-backend): `POST /api/v1/jobs` for MP4, `POST /api/v1/audio/jobs` for MP3/M4A/FLAC, then live SSE progress. Set `VITE_API_URL` if the API is not `http://localhost:5000/api/v1`. Load/title still uses YouTube oEmbed.

Docs: [Architecture](./docs/ARCHITECTURE.md) · [Engineering](./docs/ENGINEERING.md) · [Deployment](./docs/DEPLOYMENT.md)

![TypeScript](https://img.shields.io/badge/TypeScript-7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-20232a?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-1+-000000?style=for-the-badge&logo=bun&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

## Features

- Full-video extract vs precision start/end slicer
- Dual YouTube preview (original + looping cropped clip) with side-by-side or focus-cropped layout
- Two-way URL state (`?v=&start=&end=&format=&quality=&mode=&view=`)
- MP4 1080p/720p/480p and audio MP3/M4A/FLAC
- Copyable direct-download API URL and workspace share link
- Live extract progress from yt-dlp (queued / downloading % / merging), toasts, shortcuts (Space, `[`, `]`, R)

## Stack

| Layer        | Tooling                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------ |
| Runtime      | React 19, TypeScript 7                                                                           |
| Bundler      | Vite 8 (Rolldown + Oxc transform/minify, React Compiler via `oxc-transform-react`)               |
| UI           | Tailwind CSS 4, Lucide                                                                           |
| Quality      | oxlint, oxfmt, Jest, Fallow                                                                      |
| Supply chain | Bun exact versions, ignored install scripts, LavaMoat allow-list, Husky pre-push, GitHub Actions |

## Requirements

- [Bun](https://bun.sh) ≥ 1.0
- Node.js ≥ 24 (engines field; TypeScript and Vite)

## Setup

```bash
bun install --frozen-lockfile
bun run allow-scripts
bun run dev
```

Prefer `--frozen-lockfile` so install matches `bun.lock` (same as CI). Use plain `bun install` or `bun add` only when you intend to change dependencies.

`bunfig.toml` sets `ignoreScripts = true`. Follow install with `bun run allow-scripts` so only allow-listed native install scripts run (`esbuild`, `unrs-resolver`, `core-js`).

Optional env (defaults shown):

```bash
VITE_API_URL=http://localhost:5000/api/v1
```

## Scripts

| Command                           | Purpose                                                      |
| --------------------------------- | ------------------------------------------------------------ |
| `bun run dev`                     | Vite development server                                      |
| `bun run build`                   | `tsc -b` + production build → `dist/`                        |
| `bun run preview`                 | Serve the production build                                   |
| `bun verify`                      | Lint, format check, typecheck, tests, Fallow dead-code       |
| `bun run lint` / `bun run format` | oxlint / oxfmt                                               |
| `bun run test`                    | Jest                                                         |
| `bun run allow-scripts`           | Run LavaMoat-allowlisted install scripts                     |
| `bun run check-install-scripts`   | Fail if a top-level package has an unexpected install script |

Husky **pre-push** runs `bun verify`. CI on `main` / `develop` runs verify plus an audit job.

## Project structure

```text
ax-clipforge-frontend/
├── public/                      # Static assets copied to dist
│   ├── _headers                 # CSP and security headers
│   ├── favicon.* / icon-*.png   # App icons
│   ├── logo.svg
│   └── site.webmanifest
├── src/
│   ├── components/
│   │   ├── layout/              # Header, Footer
│   │   ├── player/              # OriginalPlayer, CroppedPlayer, PlayerWorkspace
│   │   ├── controls/            # URL, mode, trim, format, API URL
│   │   └── ui/                  # Toasts, download progress
│   ├── hooks/                   # YouTube player, URL sync, download job, toasts
│   ├── services/api.ts          # Express client (jobs, audio jobs, oEmbed load)
│   ├── types/index.ts
│   ├── lib/utils.ts
│   ├── tests/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── scripts/check-install-scripts.mjs
├── .github/workflows/ci.yml
├── vite.config.ts
├── bunfig.toml
└── package.json
```

```text
src/components/
├── layout/
│   ├── Header.tsx
│   └── Footer.tsx
├── player/
│   ├── OriginalPlayer.tsx
│   ├── CroppedPlayer.tsx
│   └── PlayerWorkspace.tsx
├── controls/
│   ├── UrlInputBar.tsx
│   ├── ModeToggle.tsx
│   ├── TimeRangeSlider.tsx
│   ├── TimeInputs.tsx
│   ├── FormatSelector.tsx
│   └── DirectUrlCard.tsx
└── ui/
    ├── ToastStack.tsx
    └── DownloadProgress.tsx
```

## License

Proprietary. Internal use only. Not for sale or distribution.

See [LICENSE](./LICENSE).
