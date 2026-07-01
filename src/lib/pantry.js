// Pantry gating: which of a dish's pantry-tracked ingredients is the cook out of?
// Ingredients not in the pantry (staples like salt/water/oil) never gate a dish.

const asSet = (v) => (v instanceof Set ? v : new Set(v))

export function missingIngredients(dish, owned, pantry) {
  const ownedSet = asSet(owned)
  const pantrySet = asSet(pantry)
  return dish.ingredients
    .map((i) => i.item)
    .filter((item) => pantrySet.has(item) && !ownedSet.has(item))
}

export function isAvailable(dish, owned, pantry) {
  return missingIngredients(dish, owned, pantry).length === 0
}
