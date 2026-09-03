# Decision log

Settled decisions, reconstructed from git history and code comments. Do not
re-litigate these without the user asking. "(inferred)" = deduced from code,
not found stated.

1. **No backend; static SPA on GitHub Pages.** Free hosting, zero ops, works
   offline as a PWA. Rejected: any server/database — nothing here needs one
   (inferred). Consequence: all persistence is localStorage; sharing is via URL.

2. **Test-first, pure-logic-first.** All logic in `src/lib/` pure modules with
   sibling tests; React (`App.jsx`) is glue covered by jsdom integration tests.
   Rejected: testing through the UI only — too slow and brittle (inferred).

3. **Protein as a first-class axis** (commit `711f317`, the "Glaze Lab" pivot
   from Salmon Lab). A build is protein-agnostic; `applyProtein` injects the
   protein as the leading ingredient. Rejected: per-protein recipe copies —
   would multiply 10 glazes × 8 proteins into 80 near-duplicates.

4. **Cook data is researched per protein/appliance, not generic** (commit
   `c549b9a`). Temps/times/target-internals come from appliance research
   (Innsky 5.8-qt basket + USDA FSIS), e.g. chicken thigh was corrected
   17→24 min. The UI always says "cook to internal temp with a thermometer"
   because air-fryer set temps drift. Don't adjust these values from general
   knowledge; change them only with a source or user test-cook feedback.
   Source research doc lived outside the repo (`~/Downloads/compass_artifact_wf-bcc32e96-*.md`).

5. **Diet tags derived from ingredients** at render time, never authored per
   dish. Rejected: hand-tagging — tags drift when recipes change. The meat set
   deliberately includes chicken stock so stock dishes aren't "vegetarian".

6. **Doneness as data** (`levels` on steak/salmon; `withDoneness` swaps
   time+target). Rejected: a global doneness setting — only some proteins have
   meaningful levels (inferred).

7. **Wall-clock timer** — `endsAt` timestamp, not setInterval decrements
   (commit `e2e0f4c`), so backgrounded tabs stay accurate. Also: AudioContext
   is unlocked on the Start tap (iOS requires a user gesture for the beep).

8. **Self-hosted fonts** (latin woff2 in `src/fonts/`, precached). Rejected:
   Google Fonts CDN — an offline PWA cold-launch would lose its typography.

9. **Sharing via URL hash** (`urlstate.js`) encoding only non-default values.
   Rejected: server-side share links (no backend) (inferred).

10. **Per-unit calibration as a single ±%** applied to all air-fryer times
    (`calibrate.js`), rounded to 5 s. Rejected: per-dish overrides — too much
    UI for the benefit (inferred).

11. **Deploy = GitHub Actions → Pages** on push to `main`, with lint+test as
    gates. `base: '/glaze-lab/'` matches the repo name. Lockfile committed so
    CI uses reproducible `npm ci`.

12. **Versioned localStorage keys** (`glazelab.*.v1`) with corruption-safe
    reads (bad JSON → default, never throw). Shape changes get a new version
    suffix rather than migrations (inferred).

13. **Feature development is done.** As of Jul 2026 the owner considers the
    backlog exhausted; the next input is real cooking use, not more features.
    Don't invent features; fix what feedback surfaces.
