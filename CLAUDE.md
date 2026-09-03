# Glaze Lab — agent guide

**Read this first, then [HANDOFF.md](HANDOFF.md) for current state. Detail: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/DECISIONS.md](docs/DECISIONS.md).**

Glaze Lab is a client-side React 18 + Vite 5 PWA for hands-off countertop cooking:
10 air-fryer glaze builds, 27 rice-cooker bowls, 8 sides, 6 coordinated meal plans,
each cookable with a swappable protein. Cook data is grounded in the owner's real
appliances (COSORI CRC-R501-KUS rice cooker, Innsky 5.8-qt air fryer) + USDA temps.
No backend, no server state — a static SPA deployed to GitHub Pages.
**State: feature-complete and stable.** 107/107 tests pass, CI green, live at
https://kejjeh.github.io/glaze-lab/ (GitHub repo `Kejjeh/glaze-lab`).

## Commands (all verified working)

```bash
npm install        # once (Node 22 in CI; lockfile committed)
npm test           # vitest — 107 tests, ~10s. THE smoke test.
npm run lint       # eslint (flat config), zero warnings expected
npm run build      # vite build → dist/ (also validates PWA config)
npm run verify     # lint + test + build in one shot — run before finishing any task
npm run dev        # dev server at http://localhost:5173/glaze-lab/
npm run format     # prettier --write .
```

There is no data pipeline, database, or env var. Nothing needs credentials.

## Architecture map (detail in docs/ARCHITECTURE.md)

| File | What it does |
| --- | --- |
| `src/data/recipes.js` | All recipe data: `PROTEINS`, `PANTRY`, `STAPLES`, `GLAZE`, `RICE`, `SIDES` |
| `src/data/meals.js` | `MEALS` — 6 two-appliance timed meal plans |
| `src/lib/protein.js` | **Core model.** `applyProtein` injects protein into a build; `withDoneness` |
| `src/lib/pantry.js` | Pantry gating — which dishes you can make |
| `src/lib/diet.js` | Diet tags derived from ingredients (never stored) |
| `src/lib/timer.js` | Wall-clock (`endsAt`-based) cook timer |
| `src/lib/runner.js` | Live meal-runner step status + countdown |
| `src/lib/scaling.js`, `filters.js`, `search.js`, `insights.js` | Batch scaling, lane/locked filters, search, "buy X unlocks N" |
| `src/lib/calibrate.js`, `storage.js`, `urlstate.js`, `ics.js`, `meals.js` | Calibration %, localStorage, share-URL codec, .ics export, step ordering |
| `src/App.jsx` | The only React component tree (~960 lines) — composes all of the above |
| `vite.config.js` | PWA manifest + `base: '/glaze-lab/'` |

## Conventions and gotchas

- **Test-first repo.** Every `src/lib/*.js` is pure (no React, no DOM) with a sibling
  `*.test.js`. Keep new logic out of `App.jsx`; put it in a lib module with tests.
- **Tests run in node by default**; DOM tests opt in per-file with a
  `// @vitest-environment jsdom` first-line comment (see `src/App.test.jsx`).
- **Recipe data integrity is test-enforced**: every ingredient `item` must be a
  `PANTRY` or `STAPLES` id (`recipes.test.js`). Add the pantry entry first.
- **Diet tags are derived, never authored.** If you add a meat-ish ingredient
  (incl. stocks), add it to the meat/fish sets in `src/lib/diet.js` or dishes
  get mis-tagged vegetarian.
- **Timer must stay timestamp-based** (`endsAt`), not tick-decremented — it survives
  backgrounded tabs. Same for the meal runner (elapsed since a start timestamp).
- **Fonts are self-hosted** (`src/fonts/`, woff2). Never add Google Fonts links —
  offline PWA typography depends on it.
- **`base: '/glaze-lab/'`** in `vite.config.js` must match the GitHub repo name or
  every asset 404s on Pages.
- **Push to `main` auto-deploys** to the live site via `.github/workflows/deploy.yml`
  (npm ci → lint → test → build → Pages). Don't push casually; branches are safe.
- **Lockfile is committed**; CI uses `npm ci`. If you change deps, commit
  `package-lock.json` too.
- `dist/` is generated output — never edit or commit it.
- localStorage keys are versioned (`glazelab.pantry.v1`, `.protein.v1`, `.calib.v1`,
  `.favs.v1`, `.custom.v1`). If you change a stored shape, bump the key version and
  keep `storage.js` corruption-safe (bad JSON must not throw).
- Cook temps/times are **researched values** (Innsky 5.8-qt + USDA). Don't "fix"
  them from general knowledge; see docs/DECISIONS.md.
- Dev machine is Windows; scripts are plain npm and work cross-platform.

## Before you finish any task

```bash
npm run verify
```

All three must pass (lint clean, 107+ tests green, build succeeds). If you added
logic, you added tests. Don't push to `main` unless the user asked for a deploy.

## Model routing

**Safe for Sonnet** (routine, well-fenced by tests):
- Adding/editing recipes, sides, or meals in `src/data/` (integrity tests catch mistakes)
- Copy, CSS/theming tweaks in `styles.css`, README edits
- Adding tests, small pure-function additions in `src/lib/` with tests

**Escalate to Opus:**
- `src/lib/protein.js` (protein/doneness injection — the core model)
- `timer.js` / `runner.js` timing semantics, `urlstate.js` / `ics.js` formats
- PWA/service-worker/`vite.config.js` changes, CI workflow changes
- Anything cross-cutting in `App.jsx` state, or changing researched cook data
