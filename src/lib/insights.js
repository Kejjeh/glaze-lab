// Pantry intelligence — turn "what's missing" into "what to buy next".
import { missingIngredients } from './pantry.js'

// For each pantry item you don't own: how many dishes become makeable if you
// buy *just that one item* (unlocks), and how many need it at all (neededBy).
// Only items that unlock at least one dish are returned, best first.
export function missingImpact(dishes, owned, pantry) {
  const unlocks = new Map()
  const neededBy = new Map()
  for (const dish of dishes) {
    const missing = missingIngredients(dish, owned, pantry)
    if (missing.length === 1) {
      const only = missing[0]
      unlocks.set(only, (unlocks.get(only) ?? 0) + 1)
    }
    for (const item of missing) neededBy.set(item, (neededBy.get(item) ?? 0) + 1)
  }
  return [...unlocks.keys()]
    .map((item) => ({ item, unlocks: unlocks.get(item), neededBy: neededBy.get(item) ?? 0 }))
    .sort(
      (a, b) => b.unlocks - a.unlocks || b.neededBy - a.neededBy || a.item.localeCompare(b.item),
    )
}

// Every missing item across the given dishes, deduped, most-needed first.
export function shoppingList(dishes, owned, pantry) {
  const counts = new Map()
  for (const dish of dishes) {
    for (const item of missingIngredients(dish, owned, pantry)) {
      counts.set(item, (counts.get(item) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .map(([item, count]) => ({ item, count }))
    .sort((a, b) => b.count - a.count || a.item.localeCompare(b.item))
}
