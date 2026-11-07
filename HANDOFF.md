# Handoff — state of play (2026-09-19)

Read [CLAUDE.md](CLAUDE.md) first. This file is the "what's actually going on" snapshot.

## Done and working

Everything shipped is working. As of the last feature commit (`5b3977e`, Jul 11 2026):
four modes (Air-Fryer / Rice-Cooker / Sides / Meals), protein axis + doneness,
pantry gating + shopping insights, search + derived diet filters, batch scaling,
wall-clock cook timers, live meal runner (countdown + beep + notification + wake
lock), calibration, favorites, custom glazes, share-URL, .ics export, print,
dark mode, offline PWA with self-hosted fonts.

**2026-09-19 — meal-runner / timer recovery milestone** (branch
`claude/optimistic-goodall-natqb8`, draft PR for independent review):

- Running, paused and finished cook timers and the live meal runner now survive
  a reload, a killed PWA tab or a phone restart (`src/lib/session.js`,
  `glazelab.session.v1`). A "Resumed your cook" notice with *Clear cook* shows
  what came back; a corrupt saved session shows an error notice and is cleared.
- Corrupt `favs` / `custom` / `calib` localStorage values no longer white-screen
  the app or render `NaN:NaN` (`loadArray` / `loadNumber` in `storage.js`).
- Reset now re-derives the timer from the current protein/doneness/calibration.
- System clock set backwards: remaining time is clamped to the recipe duration
  and running anchors are rebased so progress is preserved; forward jumps and
  backgrounded tabs behave as before (wall clock wins).
- Verified 2026-09-19: `npm run verify` passes (lint clean, 132/132 tests, build
  OK) and Playwright/Chromium runs at desktop 1200px and iPhone-13 viewport
  confirmed a meal + timer resumed after `page.reload()` with zero page errors.
  Screenshots: [docs/verification/](docs/verification/). Recipes, temps and
  meal step timings are untouched.

## In progress

Nothing. The recovery branch is complete and awaiting review; not merged, not
deployed.

## Known bugs / failing tests

None known. No failing tests.

**Unverified (needs a physical iPhone — cannot be checked by an agent):**
iOS Add-to-Home-Screen install, Web Notifications, Screen Wake Lock, and the
timer finish beep. These were built to spec but never confirmed on-device. The
reload-recovery path was verified in headless Chromium with an iPhone-13 viewport,
not in iOS Safari itself.

## Prioritized next steps

- **P0 — review + merge the recovery PR**, then deploy when the owner is ready
  (push to `main` auto-deploys).
- **P1 — Lighthouse/PWA audit** (one session): run Lighthouse against
  `npm run build && npm run preview` (or the live site), fix only cheap,
  behavior-preserving findings (meta tags, manifest fields, a11y labels).
  Accept: PWA-installable check passes; no regressions in `npm run verify`.
- **P1 — manifest screenshots** (one session): add `screenshots` entries to the
  PWA manifest in `vite.config.js` + PNG assets in `public/`, for a richer iOS/
  Android install sheet. Accept: build passes, manifest validates in devtools.
- **P2 — on-device iOS verification** (requires the owner's phone, agent can
  only prepare a checklist): install A2HS, start a meal plan, kill the app,
  reopen → the plan should resume with the "Resumed your cook" notice; run a
  timer to zero backgrounded, confirm beep/notification/wake lock.

## Open questions (for the owner)

1. `CONTEXT.md` was superseded by CLAUDE.md/HANDOFF.md and reduced to a pointer.
   Delete it entirely, or keep the pointer?
2. Is deploying (pushing to `main`) something agents may do routinely, or
   should every deploy be user-approved? (Assumed: user-approved.)
3. Recovery sessions expire after 24 h (`SESSION_MAX_AGE_MS`). Is that the right
   cutoff for overnight/slow-cooker-style use, or should finished timers be kept?

## Tech debt (known, not urgent)

- `src/App.jsx` is ~1010 lines — one component tree. Deliberate (logic is all in
  `src/lib/`); do **not** split it without being asked.
- `.claude/launch.json` config name is still `salmon-lab-preview` (pre-rebrand).
  Harmless; rename only if touching the file anyway.
- No E2E/browser-automation tests in CI; DOM coverage is jsdom-only. The
  Playwright verification script used for this milestone lived outside the repo
  (global Playwright + the environment's Chromium) to avoid adding a dependency.
- Dependencies pinned to mid-2026 versions; no audit since. Don't bulk-upgrade
  casually — CI + lockfile keep it reproducible.
