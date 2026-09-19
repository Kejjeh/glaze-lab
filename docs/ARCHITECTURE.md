# Architecture

Static single-page PWA. No backend, no API, no database. All state is in-memory
React state plus five versioned localStorage keys. Everything below is client-side.

## Data flow

```
src/data/recipes.js  (PROTEINS, PANTRY, STAPLES, GLAZE, RICE, SIDES)
src/data/meals.js    (MEALS)
        │  static data, integrity-tested
        ▼
src/lib/*  — pure functions (no React, no DOM)
   protein.applyProtein(build, protein)   ← the core transform
   protein.withDoneness(protein, level)
   pantry / diet / filters / search / scaling / insights
   timer / runner / calibrate            ← time-based (wall-clock)
   session                               ← cook-in-progress persistence + recovery
   storage / urlstate / ics              ← persistence & interchange
        │  data in → data out
        ▼
src/App.jsx  — single component tree; holds all UI state, calls lib functions,
               renders four mode tabs (Air-Fryer · Rice-Cooker · Sides · Meals)
        │
        ├── localStorage  (via lib/storage.js; keys glazelab.*.v1)
        ├── URL hash      (via lib/urlstate.js; Share button / load-time restore)
        └── downloads     (lib/ics.js calendar export; print stylesheet)
```

## Key abstractions

**Build** — a protein-agnostic recipe (a glaze, a rice base). It has ingredients,
a mode (`air-fryer` / `rice-cooker`), and for rice its COSORI program + ratio.

**Protein** — the swappable axis. Each of the 8 proteins carries its researched
air-fryer `tempF`, `cookSeconds`, target internal temp (`doneness`), and a prep
tip; steak and salmon also carry doneness `levels` (rare→well).

**`applyProtein(build, protein)`** merges the two: the protein becomes the leading
ingredient, and for air-fryer builds the cook temp/time/target come from the
protein. Because the protein is then "just another ingredient", pantry gating,
diet tags, batch scaling, and the timer all follow the chosen protein with no
special cases. This is why the whole app stays small.

**Derived, not stored** — diet tags (`lib/diet.js`) are computed from ingredients
every render; availability is computed from the pantry set. Nothing that can be
derived is persisted, so it can't drift.

**Wall-clock time** — the cook timer stores an `endsAt` timestamp and the meal
runner works off "seconds since start". A backgrounded phone tab stops firing
intervals; timestamps make the countdown correct on wake.

**Cook session survives reload** — `lib/session.js` serializes running/paused/
finished timers and the meal runner's `startedAt` to `glazelab.session.v1` on
every change, and `App.jsx` restores them in its first render. Restore validates
every field (a broken entry is dropped, bad JSON shows a clear notice and
clears), ignores sessions older than 24 h, and rebases anchors when the system
clock was set backwards (a save stamp in the future, or a heartbeat that sees
time go backwards). Forward jumps are indistinguishable from real elapsed time
and are trusted, per the wall-clock decision.

## Why it's structured this way

Built test-first. All decision logic lives in `src/lib/` as pure modules tested
through their public interfaces (86 logic/data tests, fast, node env), leaving
`App.jsx` as glue verified by 21 jsdom integration tests. The payoff for agents:
you can change or extend logic without rendering anything, and the data files are
integrity-tested so recipe edits fail loudly instead of breaking the UI.

## Boundaries a change is likely to cross

- **New recipe/side/meal** → `src/data/*` only, plus `lib/diet.js` if it uses a
  new meat/fish ingredient. Tests in `src/data/*.test.js` fence you in.
- **New protein** → `recipes.js` (`PROTEINS` + `PANTRY` entry) + `diet.js` sets;
  UI picker in `App.jsx` renders from data, so usually no UI change.
- **New per-dish feature** (badge, filter…) → a new `lib/` module + tests, then
  wire into `App.jsx`, then a DOM test in `App.test.jsx`.
- **Anything shareable/persisted** → also touches `urlstate.js` codec or a new
  versioned localStorage key via `storage.js`.
- **PWA/deploy behavior** → `vite.config.js` (manifest, precache globs, `base`)
  and `.github/workflows/deploy.yml`. Test locally with `npm run build && npm run preview`.
