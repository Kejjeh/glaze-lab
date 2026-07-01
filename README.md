# Salmon Lab 🐟

A client-side PWA for cooking salmon: **10 air-fryer glaze builds** and **24 rice-cooker
dishes**, with a shared pantry that greys out dishes you can't make, live batch scaling,
lane filters, per-card cook timers, and `localStorage` persistence. No backend — a static
SPA you can "Add to Home Screen" on iOS.

## Features

- **Two modes** — Air-Fryer (glaze builds) ↔ Rice-Cooker (rice dishes), each with its own lanes.
- **Shared pantry** — uncheck what you're out of; every dish that needs it greys out (in *both*
  modes) with a `needs:` ribbon. Staples (salt, oil, water…) are always assumed on hand.
- **Pantry intelligence** — "buy X → unlocks N dishes" hints and a one-tap shopping list of
  everything you're missing.
- **Search + dietary filters** — free-text search over names/ingredients, plus pescatarian /
  vegetarian / vegan / gluten-free tags *derived from the ingredients* (so they can't drift).
- **Batch scaling** — ½× to 4×, rescales every ingredient amount live (shown as clean fractions).
- **Lane filters** + "Hide locked" to see only what you can cook right now.
- **Cook timers** on air-fryer cards — a wall-clock countdown that stays accurate even after the
  tab is backgrounded, with a finish beep and a Screen Wake Lock so the phone won't sleep mid-cook.
- **Persistence** — your pantry survives reloads via `localStorage` (`salmonlab.pantry.v1`).
- **PWA** — installable and fully offline: the app shell *and self-hosted fonts* are precached by
  a service worker, so a cold offline launch keeps its real typography.

## Architecture

The app is built test-first. All logic lives in small pure modules so it can be verified
through public interfaces, independent of React:

| Module | Responsibility |
| --- | --- |
| `src/data/recipes.js` | `GLAZE`, `RICE`, `PANTRY`, `STAPLES` data (+ integrity-tested) |
| `src/lib/pantry.js` | `missingIngredients`, `isAvailable` — pantry gating |
| `src/lib/insights.js` | `missingImpact`, `shoppingList` — "what to buy next" |
| `src/lib/search.js` | `searchDishes` — free-text search |
| `src/lib/diet.js` | `dietTags`, `matchesDiet` — dietary tags derived from ingredients |
| `src/lib/scaling.js` | `scaleAmount`, `scaleIngredients`, `formatAmount` — batch scaling |
| `src/lib/filters.js` | `filterDishes` — lane + hide-locked filtering |
| `src/lib/storage.js` | `loadOwned`, `saveOwned` — corruption-safe persistence |
| `src/lib/timer.js` | `createTimer/start/pause/reset/remaining/settle/formatTime` — wall-clock timer |
| `src/App.jsx` | React UI that composes the above |

**57 tests** (46 pure-logic/data + 11 DOM integration) cover the core promises.

## Develop

```bash
npm install
npm test            # vitest — all 57 tests
npm run lint        # eslint (flat config)
npm run format      # prettier --write
npm run dev         # dev server at /salmon-lab/
npm run build       # production build → dist/
npm run preview     # serve the built app
```

## Deploy

### GitHub Pages (default)

Pushing to `main` runs `.github/workflows/deploy.yml` (install → lint → test → build → deploy).
One-time setup: **Settings → Pages → Source: GitHub Actions**.

The Vite `base` is `'/salmon-lab/'` to match a repo named `salmon-lab`. **If your repo has a
different name, change `base` in `vite.config.js` to `'/<repo-name>/'`** or asset paths 404.

### Root-served hosts (Vercel / Netlify / Cloudflare Pages)

Set `base: '/'` in `vite.config.js`, then build (`npm run build`) with output dir `dist`.

## Configuration decisions

- **Host:** GitHub Pages (workflow included).
- **Repo name:** `salmon-lab` → `base: '/salmon-lab/'`.
- **Lockfile:** `package-lock.json` is committed, so CI uses `npm ci` (reproducible installs).
