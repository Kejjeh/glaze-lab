# Salmon Lab 🐟

A client-side PWA for cooking salmon: **10 air-fryer glaze builds** and **24 rice-cooker
dishes**, with a shared pantry that greys out dishes you can't make, live batch scaling,
lane filters, per-card cook timers, and `localStorage` persistence. No backend — a static
SPA you can "Add to Home Screen" on iOS.

## Features

- **Two modes** — Air-Fryer (glaze builds) ↔ Rice-Cooker (rice dishes), each with its own lanes.
- **Shared pantry** — uncheck what you're out of; every dish that needs it greys out (in *both*
  modes) with a `needs:` ribbon. Staples (salt, oil, water…) are always assumed on hand.
- **Batch scaling** — ½× to 4×, rescales every ingredient amount live (shown as clean fractions).
- **Lane filters** + "Hide locked" to see only what you can cook right now.
- **Cook timers** on air-fryer cards — start/pause/reset, counts down, beeps when done.
- **Persistence** — your pantry survives reloads via `localStorage` (`salmonlab.pantry.v1`).
- **PWA** — installable, offline-capable (app shell precached by a service worker).

## Architecture

The app is built test-first. All logic lives in small pure modules so it can be verified
through public interfaces, independent of React:

| Module | Responsibility |
| --- | --- |
| `src/data/recipes.js` | `GLAZE`, `RICE`, `PANTRY`, `STAPLES` data (+ integrity-tested) |
| `src/lib/pantry.js` | `missingIngredients`, `isAvailable` — pantry gating |
| `src/lib/scaling.js` | `scaleAmount`, `scaleIngredients`, `formatAmount` — batch scaling |
| `src/lib/filters.js` | `filterDishes` — lane + hide-locked filtering |
| `src/lib/storage.js` | `loadOwned`, `saveOwned` — corruption-safe persistence |
| `src/lib/timer.js` | `createTimer/start/pause/reset/tick/formatTime` — countdown state machine |
| `src/App.jsx` | React UI that composes the above |

**36 tests** (31 pure-logic/data + 5 DOM integration) cover the core promises.

## Develop

```bash
npm install
npm test            # vitest — all 36 tests
npm run dev         # dev server at /salmon-lab/
npm run build       # production build → dist/
npm run preview     # serve the built app
```

## Deploy

### GitHub Pages (default)

Pushing to `main` runs `.github/workflows/deploy.yml` (install → test → build → deploy).
One-time setup: **Settings → Pages → Source: GitHub Actions**.

The Vite `base` is `'/salmon-lab/'` to match a repo named `salmon-lab`. **If your repo has a
different name, change `base` in `vite.config.js` to `'/<repo-name>/'`** or asset paths 404.

### Root-served hosts (Vercel / Netlify / Cloudflare Pages)

Set `base: '/'` in `vite.config.js`, then build (`npm run build`) with output dir `dist`.

## Configuration decisions

- **Host:** GitHub Pages (workflow included).
- **Repo name:** `salmon-lab` → `base: '/salmon-lab/'`.
- **Lockfile:** `package-lock.json` is committed, so CI uses `npm ci` (reproducible installs).
