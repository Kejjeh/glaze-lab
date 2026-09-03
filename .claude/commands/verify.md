---
description: Run the full check gate (lint + 107 tests + build). Run before finishing any task.
---

Run `npm run verify` in the repo root. All three stages must pass: eslint with
zero warnings, all vitest tests green (107 at handoff; more is fine, fewer is
not), and a successful `vite build`. If a stage fails, fix the cause and re-run.
Do not finish a task, and do not commit, with this failing.
