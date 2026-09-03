# Handoff — state of play (2026-09-03)

Read [CLAUDE.md](CLAUDE.md) first. This file is the "what's actually going on" snapshot.

## Done and working

Everything shipped is working. As of the last feature commit (`5b3977e`, Jul 11 2026):
four modes (Air-Fryer / Rice-Cooker / Sides / Meals), protein axis + doneness,
pantry gating + shopping insights, search + derived diet filters, batch scaling,
wall-clock cook timers, live meal runner (countdown + beep + notification + wake
lock), calibration, favorites, custom glazes, share-URL, .ics export, print,
dark mode, offline PWA with self-hosted fonts. Verified 2026-09-03 on this branch:
`npm run verify` passes (lint clean, 107/107 tests, build OK). CI was green on `main`.

## In progress

Nothing. There is no half-finished code on any branch.

## Known bugs / failing tests

None known. No failing tests.

**Unverified (needs a physical iPhone — cannot be checked by an agent):**
iOS Add-to-Home-Screen install, Web Notifications, Screen Wake Lock, and the
timer finish beep. These were built to spec but never confirmed on-device.
Also note: the in-app browser *screenshot* tool was flaky in past sessions;
verify UI via `read_page`/DOM + console instead of screenshots.

## Prioritized next steps

- **P0 — none for an agent.** The project's real next step is the owner cooking
  with it and reporting feedback. Wait for user-reported issues; fix those first.
- **P1 — Lighthouse/PWA audit** (one session): run Lighthouse against
  `npm run build && npm run preview` (or the live site), fix only cheap,
  behavior-preserving findings (meta tags, manifest fields, a11y labels).
  Accept: PWA-installable check passes; no regressions in `npm run verify`.
- **P1 — manifest screenshots** (one session): add `screenshots` entries to the
  PWA manifest in `vite.config.js` + PNG assets in `public/`, for a richer iOS/
  Android install sheet. Accept: build passes, manifest validates in devtools.
- **P2 — on-device iOS verification** (requires the owner's phone, agent can
  only prepare a checklist): install A2HS, run a timer to zero backgrounded,
  confirm beep/notification/wake lock.

## Open questions (for the owner)

1. ~~Commit the appliance research doc?~~ Resolved 2026-09-03: committed as
   [docs/appliance-research.md](docs/appliance-research.md).
2. `CONTEXT.md` was superseded by CLAUDE.md/HANDOFF.md in this handoff pass and
   reduced to a pointer. Delete it entirely, or keep the pointer?
3. Is deploying (pushing to `main`) something agents may do routinely, or
   should every deploy be user-approved? (Assumed: user-approved.)

## Tech debt (known, not urgent)

- `src/App.jsx` is ~960 lines — one component tree. Deliberate (logic is all in
  `src/lib/`); do **not** split it without being asked.
- `.claude/launch.json` config name is still `salmon-lab-preview` (pre-rebrand).
  Harmless; rename only if touching the file anyway.
- No E2E/browser-automation tests; DOM coverage is jsdom-only. Fine at this size.
- Dependencies pinned to mid-2026 versions; no audit since. Don't bulk-upgrade
  casually — CI + lockfile keep it reproducible.
