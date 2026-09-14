# Deployment

## Now

This app is developed and previewed **locally**:

```bash
bun install --frozen-lockfile
bun run allow-scripts
bun run dev
```

UI: `http://localhost:5173`

Download needs the Express API on `:5000` ([https://github.com/Ax108/ax-clipforge-backend](https://github.com/Ax108/ax-clipforge-backend)). `VITE_API_URL` defaults to `http://localhost:5000/api/v1` (copy `.env.example` → `.env.local` to override). Load/preview works without that API (oEmbed + YouTube iframes).

The API can run as `bun run dev` or `bun run docker:up` (Redis sidecar). That is local Docker, not a public API.

## Later (not done)

Hosting this frontend on **Vercel, Netlify, or Render** is possible. That hosted origin must be added to the backend `CORS_ORIGINS` allowlist.

A hosted UI **cannot** reach `localhost` or local Docker on your PC. You would need a **public HTTPS** ClipForge API (hosted container or reverse proxy) and set the same env used locally:

```bash
VITE_API_URL=https://api.example.com/api/v1
```

No frontend code changes for hosting — only that env (and add the UI origin to backend `CORS_ORIGINS`).

Until a later plan: do not assume a cloud backend exists.

## Static headers

`public/_headers` is for hosts that honor Cloudflare-style `_headers` (CSP). Vercel/Netlify need their own header config if you go there; that is not wired in this pass.
