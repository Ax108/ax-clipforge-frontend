# Architecture

ClipForge frontend is a standalone Vite + React 19 workspace for trimming, previewing, and downloading YouTube videos or timestamped clips: [https://github.com/Ax108/ax-clipforge-frontend](https://github.com/Ax108/ax-clipforge-frontend).

The API is a separate GitHub project: [https://github.com/Ax108/ax-clipforge-backend](https://github.com/Ax108/ax-clipforge-backend).

## Agent notes

- Load/preview uses YouTube oEmbed for title/channel (browser only). Duration comes from the IFrame player. Does **not** call Express or yt-dlp.
- Download is live: MP4 uses `POST /api/v1/jobs`; MP3/M4A/FLAC use `POST /api/v1/audio/jobs`. Both listen on SSE `/jobs/:id/events` and save `/jobs/:id/file` to the user's device.
- `VITE_API_URL` defaults to `http://localhost:5000/api/v1` (see `.env.example`). Trailing slashes are stripped. Hosted builds only change this env — no code change.
- Same clip parameters are cached on the API. Progress events are real yt-dlp lines, not timers.

## Current run mode

| Surface  | Now                                        | Later                           |
| -------- | ------------------------------------------ | ------------------------------- |
| This app | Local Vite `http://localhost:5173`         | Maybe Vercel / Netlify / Render |
| API      | Express on `:5000` or local Docker + Redis | Maybe a public image            |

A hosted frontend **cannot** call Docker on your PC. See [DEPLOYMENT.md](./DEPLOYMENT.md).

## What the UI does

1. Paste a YouTube URL or 11-character id. Title/channel from oEmbed; duration from the iframe when it reports length.
2. URL bar **X** clears the input and resets players, trim, format, job, and share query params (empty splash again).
3. Full Video vs Precision Clip (one-second minimum gap).
4. Dual preview, dual-handle slider, format chips.
5. Download: real job progress (`queued` / `downloading` / `merging` / `complete`). Cached repeats skip YouTube.
6. Copyable `GET /api/v1/download?...` for video curl, `GET /api/v1/audio?...` for audio curl (same cache as `format=mp3|m4a|flac`).
7. Query string `?v=&start=&end=&format=&quality=&mode=&view=`.
8. Shortcuts: Space, `[`, `]`, `R`.

No Zustand.

## Data flow

```text
URL bar → YouTube oEmbed (title) + iframes (duration from player)
URL bar X → reset workspace (no API call)
Download → POST /jobs (mp4) or POST /audio/jobs (audio)
         → EventSource /jobs/:id/events → GET /jobs/:id/file
Direct URL card → GET /download?... (mp4) or GET /audio?... (audio)
```
