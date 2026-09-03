---
description: Deploy to the live site (GitHub Pages) — gated, user-approved.
---

Deploying = pushing `main` to GitHub. `.github/workflows/deploy.yml` then runs
npm ci → lint → test → build → publish to https://kejjeh.github.io/glaze-lab/.

1. Confirm the user actually asked to deploy. Never push `main` as a side effect.
2. Run `npm run verify` locally first; abort on any failure.
3. Merge or commit the work to `main` (no force-push), then `git push origin main`.
4. Check the run: `gh run watch` or `gh run list --limit 1` until it succeeds.
5. Report the live URL. If CI fails, read the failing step's log, fix, repeat.
