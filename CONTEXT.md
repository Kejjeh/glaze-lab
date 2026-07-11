# Glaze Lab — project state & context

A durable snapshot for future sessions. (User-facing feature/architecture detail lives in
[README.md](README.md); this file captures state, decisions, and where things are.)

## What it is

**Glaze Lab** (formerly "Salmon Lab") — a client-side React + Vite **PWA** for hands-off
countertop cooking, grounded in the user's real appliances (a **COSORI CRC-R501-KUS** rice cooker
and an **Innsky 5.8-qt** air fryer) plus USDA safe internal temps.

- **Live:** https://kejjeh.github.io/glaze-lab/
- **Repo:** https://github.com/Kejjeh/glaze-lab (owner `Kejjeh`)
- **Local:** `C:\Users\Joshua\Documents\Claude\Projects\Cooking`
- No backend — a static SPA, offline-capable, installable.

## Stack & commands

React 18 · Vite 5 · vitest · ESLint 9 (flat) + Prettier · vite-plugin-pwa.

```bash
npm install
npm test      # vitest — 107 tests (~86 pure-logic/data + 21 DOM integration)
npm run lint  # eslint (flat config)
npm run build # → dist/
npm run dev / preview   # /glaze-lab/
```

## Deploy

GitHub Pages via Actions ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)):
`npm ci → lint → test → build → deploy`. Node 22, `actions/*@v5`, Pages `build_type=workflow`.
Vite `base: '/glaze-lab/'`. Lockfile committed. **Push to `main` auto-deploys.**

## Architecture (test-first; pure logic isolated from React)

- **Data** — `src/data/recipes.js` (`GLAZE` 10 glaze builds, `RICE` 27 bowls incl. grains,
  `SIDES` 8, `PANTRY`, `STAPLES`, `PROTEINS` 8) and `src/data/meals.js` (`MEALS` 6). Both
  integrity-tested.
- **Logic** — `src/lib/`: `pantry`, `protein` (`applyProtein` injects protein temp/time/doneness/
  tip; `withDoneness` for steak/salmon levels), `scaling`, `filters`, `search`, `diet`,
  `insights`, `storage`, `timer` (wall-clock), `meals`, `runner` (live meal countdown),
  `calibrate`, `urlstate`, `ics`.
- **UI** — `src/App.jsx` composes everything; `src/styles.css` (CSS variables, light+dark).

**Core model:** a _build_ is protein-agnostic; `applyProtein(build, protein)` renders it with the
chosen protein as the leading ingredient, so gating, diet tags, and the timer all follow the
protein for free. Doneness (`withDoneness`) overrides time/target for steak & salmon.

## Modes (4 tabs)

Air-Fryer (glaze builds) · Rice-Cooker (bowls, each showing COSORI function + ratio) · Sides
(air-fryer + steamed) · Meals (6 coordinated two-appliance timelines, runnable live).

## Key decisions

- Air-fryer times/temps/target-internal are **researched per protein**, labeled as 5.8-qt-basket
  starting points; UI tells the user to **cook to internal temp with a thermometer** (set temps
  drift). Source doc: `~/Downloads/compass_artifact_wf-bcc32e96-*.md`.
- Diet tags are **derived from ingredients** (can't drift). Meat set includes chicken/beef/pork/
  wings **and chicken stock** (so stock dishes aren't mis-tagged vegetarian).
- Timer is **timestamp-based** (`endsAt`) → no drift when backgrounded.
- Fonts are **self-hosted** (`src/fonts/`, latin woff2) → correct typography offline.

## localStorage keys

`glazelab.pantry.v1` (owned set) · `glazelab.protein.v1` · `glazelab.calib.v1` (calibration %) ·
`glazelab.favs.v1` (favorites) · `glazelab.custom.v1` (custom glazes).

## Verified vs. open

- **Verified** (tests + local browser DOM/console): all logic, protein injection, doneness,
  calibration, favorites, custom glazes, meal runner countdown, share/URL restore, sides, dark
  mode. CI green.
- **Unverified (needs a physical iPhone):** Add-to-Home-Screen install, Web Notifications, Screen
  Wake Lock, and the finish beep. The browser **screenshot tool is flaky** in this environment —
  verification has been via DOM/console, not images.

## Backlog

Feature backlog is essentially exhausted (catalog, grounded cook data, live runner,
personalization, share/export, polish). The highest-value next step is **real cooking use +
feedback**, not more features. Minor: a Lighthouse/PWA audit and richer manifest screenshots were
never done.
