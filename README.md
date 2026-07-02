# Glaze Lab 🔥

A client-side PWA for hands-off, countertop cooking: **10 air-fryer glaze builds**,
**27 rice-cooker bowls**, and **6 coordinated meal plans**, cooked with the **protein of your
choice** — salmon, chicken (thigh/breast), steak, pork (chop/tenderloin), shrimp, or tofu.
Air-fryer temps/times/target-internal-temps and COSORI rice-cooker functions are tuned from
appliance research (COSORI CRC-R501-KUS + Innsky 5.8-qt + USDA). A shared pantry greys out what
you can't make, with live batch scaling, lane filters, per-card cook timers, and `localStorage`
persistence. No backend — a static SPA you can "Add to Home Screen" on iOS.

## Features

- **Protein axis** — pick a protein and every glaze (and the protein-forward rice bowls) is built
  around it, with the **temp, cook time and target internal temp adapting per protein** (salmon
  400°F/8 min → 125–130°F; chicken thigh 380°F/24 min → 165°F+), plus a per-protein prep tip.
- **Three modes** — Air-Fryer (glaze builds), Rice-Cooker (bowls, each showing its COSORI function
  - ratio), and **Meals** — coordinated start-to-plate timelines that run both appliances together.
- **Appliance-grounded** — air-fryer cards show temp + USDA target internal (cook to temp, not the
  clock); rice cards show the COSORI program (White Rice / Grains / Oatmeal…) and water ratio.
- **Shared pantry** — uncheck what you're out of; every dish that needs it (including your chosen
  protein) greys out in _both_ modes with a `needs:` ribbon. Staples are always assumed on hand.
- **Pantry intelligence** — "buy X → unlocks N dishes" hints and a one-tap shopping list.
- **Search + dietary filters** — free-text search plus pescatarian / vegetarian / vegan /
  gluten-free tags _derived from the ingredients + chosen protein_ (so they can't drift).
- **Batch scaling** — ½× to 4×, rescales every ingredient amount live (shown as clean fractions).
- **Lane filters** + "Hide locked" to see only what you can cook right now.
- **Cook timers** on air-fryer cards — a wall-clock countdown that stays accurate even after the
  tab is backgrounded, with a finish beep and a Screen Wake Lock so the phone won't sleep mid-cook.
- **Persistence** — your pantry and chosen protein survive reloads via `localStorage`.
- **PWA** — installable and fully offline: the app shell _and self-hosted fonts_ are precached by
  a service worker, so a cold offline launch keeps its real typography.

## Architecture

The app is built test-first. All logic lives in small pure modules so it can be verified
through public interfaces, independent of React:

| Module                | Responsibility                                                                 |
| --------------------- | ------------------------------------------------------------------------------ |
| `src/data/recipes.js` | `GLAZE`, `RICE`, `PANTRY`, `STAPLES`, `PROTEINS` data (+ integrity-tested)     |
| `src/lib/protein.js`  | `applyProtein` — inject the protein + its temp/time/doneness/tip               |
| `src/data/meals.js`   | `MEALS` — coordinated two-appliance meal plans (+ integrity-tested)            |
| `src/lib/meals.js`    | `orderedSteps`, `elapsedLabel` — meal timeline ordering + labels               |
| `src/lib/pantry.js`   | `missingIngredients`, `isAvailable` — pantry gating                            |
| `src/lib/insights.js` | `missingImpact`, `shoppingList` — "what to buy next"                           |
| `src/lib/search.js`   | `searchDishes` — free-text search                                              |
| `src/lib/diet.js`     | `dietTags`, `matchesDiet` — dietary tags derived from ingredients              |
| `src/lib/scaling.js`  | `scaleAmount`, `scaleIngredients`, `formatAmount` — batch scaling              |
| `src/lib/filters.js`  | `filterDishes` — lane + hide-locked filtering                                  |
| `src/lib/storage.js`  | `loadOwned`, `saveOwned` — corruption-safe persistence                         |
| `src/lib/timer.js`    | `createTimer/start/pause/reset/remaining/settle/formatTime` — wall-clock timer |
| `src/App.jsx`         | React UI that composes the above                                               |

A **build** is a protein-agnostic recipe (a glaze, a rice base). `applyProtein(build, protein)`
renders it with the picked protein as the leading ingredient — so pantry gating, diet tags, and
the cook timer all follow the protein for free.

**80 tests** (65 pure-logic/data + 15 DOM integration) cover the core promises.

## Develop

```bash
npm install
npm test            # vitest — all 80 tests
npm run lint        # eslint (flat config)
npm run format      # prettier --write
npm run dev         # dev server at /glaze-lab/
npm run build       # production build → dist/
npm run preview     # serve the built app
```

## Deploy

### GitHub Pages (default)

Pushing to `main` runs `.github/workflows/deploy.yml` (install → lint → test → build → deploy).
One-time setup: **Settings → Pages → Source: GitHub Actions**.

The Vite `base` is `'/glaze-lab/'` to match a repo named `glaze-lab`. **If your repo has a
different name, change `base` in `vite.config.js` to `'/<repo-name>/'`** or asset paths 404.

### Root-served hosts (Vercel / Netlify / Cloudflare Pages)

Set `base: '/'` in `vite.config.js`, then build (`npm run build`) with output dir `dist`.

## Configuration decisions

- **Host:** GitHub Pages (workflow included).
- **Repo name:** `glaze-lab` → `base: '/glaze-lab/'`.
- **Lockfile:** `package-lock.json` is committed, so CI uses `npm ci` (reproducible installs).
