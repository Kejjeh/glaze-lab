---
description: Add a glaze build, rice bowl, side, or meal plan — the exact procedure.
argument-hint: what to add, e.g. "a teriyaki-lime glaze" or "a congee bowl"
---

Add the recipe the user described: $ARGUMENTS

Procedure (data only — no UI changes needed; cards render from data):

1. Open `src/data/recipes.js`. Copy the shape of an existing entry in the right
   array: `GLAZE` (air-fryer glaze build, protein-agnostic — no protein in its
   ingredients), `RICE` (set `usesProtein: true` only if protein-forward; always
   set the COSORI `cooker` program + water ratio), or `SIDES`. Meals go in
   `src/data/meals.js` (`MEALS`, time-stamped steps across both appliances).
2. Every ingredient `item` must be an existing `PANTRY` or `STAPLES` id. If an
   ingredient is new, add it to `PANTRY` first (tests enforce this).
3. If a new ingredient is meat/fish/stock, add it to the matching set in
   `src/lib/diet.js` — otherwise the dish is mis-tagged vegetarian/vegan.
4. Run `npm run verify`. The data tests check id uniqueness, ingredient ids, and
   catalog minimum sizes (`toBeGreaterThanOrEqual`) — adding entries won't trip
   the minimums, so read any failure carefully; it means a real shape mistake.
5. Update the catalog counts in README.md and CLAUDE.md (e.g. "10 glaze builds").

Do not invent air-fryer temps/times for new cook methods — reuse an existing
side/protein's researched values or ask the user (see docs/DECISIONS.md #4).
