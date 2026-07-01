// Dietary tags DERIVED from a dish's ingredients, so they can never drift out
// of sync with the recipe. Classification is intentionally conservative:
// "gluten-free" only when no typically-gluten-containing ingredient is present.

const MEAT = new Set(['chicken'])
const FISH = new Set(['salmon', 'shrimp'])
const DAIRY = new Set(['butter'])
const EGG = new Set(['egg'])
const HONEY = new Set(['honey'])
// Soy sauce, miso, gochujang and mirin commonly contain wheat.
const GLUTEN = new Set(['soy', 'miso', 'gochujang', 'mirin'])

export function dietTags(dish) {
  const items = new Set(dish.ingredients.map((i) => i.item))
  const has = (set) => [...set].some((x) => items.has(x))

  const noMeat = !has(MEAT)
  const noFish = !has(FISH)
  const noAnimal = noMeat && noFish && !has(DAIRY) && !has(EGG) && !has(HONEY)

  const tags = []
  if (noMeat) tags.push('pescatarian') // eats fish + plants, no meat/poultry
  if (noMeat && noFish) tags.push('vegetarian')
  if (noAnimal) tags.push('vegan')
  if (!has(GLUTEN)) tags.push('gluten-free')
  return tags
}

export function matchesDiet(dish, diet) {
  return diet === 'all' || dietTags(dish).includes(diet)
}
