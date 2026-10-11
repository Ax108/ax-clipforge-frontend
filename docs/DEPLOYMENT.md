# Deployment

## Now

This app is developed and previewed **locally**:

```bash
bun install --frozen-lockfile
bun run allow-scripts
bun run dev
```

UI: `http://localhost:5173`

CI runs `bun run build` after verify. `VITE_API_URL` is embedded at build time; the local default stays `http://localhost:5000/api/v1`.

Download needs the Express API on `:5000` ([https://github.com/Ax108/ax-clipforge-backend](https://github.com/Ax108/ax-clipforge-backend)). `VITE_API_URL` defaults to `http://localhost:5000/api/v1` (copy `.env.example` → `.env.local` to override). Load/preview works without that API (oEmbed + YouTube iframes). If the API rate-limits the UI (`429`), Download shows a toast; hammering extract from one IP can hit the backend `RATE_LIMIT_EXTRACT_MAX` (default 10 / 15 minutes).

The API can run as `bun run dev` or `bun run docker:up` (Redis sidecar). That is local Docker, not a public API.

## Coolify

Public UI: `https://temp1.astrax108.com`. API: `https://temp2.astrax108.com`.

`bun run dev` stays on `http://localhost:5000/api/v1`. The Docker image bakes the public API URL unless Coolify overrides the build args.

Coolify resource: Dockerfile, port **80**, domain `https://temp1.astrax108.com`.

Build arguments:

```bash
VITE_API_URL=https://temp2.astrax108.com/api/v1
VITE_CLIPFORGE_TOKEN=<same secret as backend CLIPFORGE_TOKEN>
```

`VITE_API_URL` and `VITE_CLIPFORGE_TOKEN` are embedded at image build. Changing them requires a rebuild. Nginx serves the bundle and sends a CSP that allows `https://temp2.astrax108.com` and `http://localhost:5000`. `public/_headers` carries the same `connect-src` for other static hosts.

## Static headers

`public/_headers` and `docker/nginx.conf` both allow the local API and `https://temp2.astrax108.com`. A location that sets its own `add_header` repeats the CSP, because Nginx does not inherit `add_header` into that location.
