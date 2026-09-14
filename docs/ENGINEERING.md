# Engineering

Tooling for [https://github.com/Ax108/ax-clipforge-frontend](https://github.com/Ax108/ax-clipforge-frontend). Product behavior is in [ARCHITECTURE.md](./ARCHITECTURE.md).

## Stack

| Layer         | Tool                                                                               |
| ------------- | ---------------------------------------------------------------------------------- |
| UI            | React 19, TypeScript 7                                                             |
| Bundler       | Vite 8 (Rolldown + Oxc transform/minify, React Compiler via `oxc-transform-react`) |
| CSS           | Tailwind CSS 4                                                                     |
| Icons         | Lucide                                                                             |
| Class names   | `clsx` + `tailwind-merge` (`cn`)                                                   |
| Lint / format | oxlint, oxfmt (no ESLint/Prettier)                                                 |
| Tests         | Jest + Testing Library                                                             |
| Dead code     | Fallow                                                                             |
| Install       | Bun `exact`, `ignoreScripts`, `minimumReleaseAge` 3 days                           |
| Scripts       | LavaMoat `@lavamoat/allow-scripts`                                                 |
| Git           | Husky pre-push `bun verify`                                                        |
| CI            | GitHub Actions on `main` / `develop`                                               |

## Verify

```bash
bun verify
```

Runs: oxlint → oxfmt check → `tsc -b` → `tsc:app` (no tests) → Jest → Fallow dead-code.

## Conventions

- Strict tsconfig: `verbatimModuleSyntax`, `erasableSyntaxOnly`, unused locals/params, no fallthrough.
- oxlint React plugin is **frontend-only**. [https://github.com/Ax108/ax-clipforge-backend](https://github.com/Ax108/ax-clipforge-backend) omits it.
- Tests live in `src/tests/`. Slider and download-label cases must stay aligned with trim-gap and `downloadButtonLabel` behavior. UrlInputBar clear must call `onClear` (full workspace reset in `App`). `formatStartJobError` / `triggerDownload` must keep a clear message for API **429**.
- Do not add Zustand unless global store is actually needed.
- `VITE_API_URL` is the Express base at [https://github.com/Ax108/ax-clipforge-backend](https://github.com/Ax108/ax-clipforge-backend) (`/jobs`, `/audio/jobs`, `/download`, `/audio`). Defaults in code and `.env.example`. Download requires that API (including its IP rate limits). Load uses YouTube oEmbed and does not call `/info`.

## Supply chain

`bunfig.toml`: `ignoreScripts = true`. After `bun install --frozen-lockfile`, run `bun run allow-scripts`. Use plain `bun install` / `bun add` only when changing dependencies. `check-install-scripts` fails if a top-level package grows an unexpected install script.
