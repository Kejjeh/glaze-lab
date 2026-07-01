// Dish filtering: by lane chip and (next) the "hide locked" toggle.
import { isAvailable } from './pantry.js'

export function filterDishes(dishes, { lane = 'all', hideLocked = false, owned, pantry } = {}) {
  return dishes.filter((dish) => {
    if (lane !== 'all' && dish.lane !== lane) return false
    if (hideLocked && !isAvailable(dish, owned, pantry)) return false
    return true
  })
}
