// Free-text dish search over name, lane, and ingredient ids + human labels.
export function searchDishes(dishes, query, labelFor = (x) => x) {
  const q = query.trim().toLowerCase()
  if (!q) return dishes
  return dishes.filter((dish) => {
    const hay = [
      dish.name,
      dish.lane,
      ...dish.ingredients.flatMap((i) => [i.item, labelFor(i.item)]),
    ]
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  })
}
