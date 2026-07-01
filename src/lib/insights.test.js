import { describe, it, expect } from 'vitest'
import { missingImpact, shoppingList } from './insights.js'

const pantry = ['miso', 'honey', 'salmon', 'soy']
const dishes = [
  { id: 'd1', ingredients: [{ item: 'miso' }, { item: 'salmon' }] },
  { id: 'd2', ingredients: [{ item: 'miso' }, { item: 'soy' }] },
  { id: 'd3', ingredients: [{ item: 'honey' }] },
  { id: 'd4', ingredients: [{ item: 'miso' }, { item: 'honey' }] },
]
const owned = ['salmon', 'soy'] // missing → d1:[miso] d2:[miso] d3:[honey] d4:[miso,honey]

describe('missingImpact', () => {
  it('ranks pantry items by how many dishes buying that one item unlocks', () => {
    expect(missingImpact(dishes, owned, pantry)).toEqual([
      { item: 'miso', unlocks: 2, neededBy: 3 }, // solely-missing in d1,d2; needed by d1,d2,d4
      { item: 'honey', unlocks: 1, neededBy: 2 }, // solely-missing in d3; needed by d3,d4
    ])
  })

  it('excludes items that unlock nothing on their own', () => {
    // With only salmon owned, every dish still needs 2+ items, so nothing is
    // a single-item unlock.
    const impact = missingImpact(dishes, ['salmon'], pantry)
    expect(impact.every((x) => x.unlocks > 0)).toBe(true)
    expect(impact.some((x) => x.item === 'salmon')).toBe(false)
  })
})

describe('shoppingList', () => {
  it('aggregates the missing items across the given dishes, most-needed first', () => {
    const list = shoppingList(dishes, owned, pantry)
    expect(list).toEqual([
      { item: 'miso', count: 3 },
      { item: 'honey', count: 2 },
    ])
  })

  it('is empty when everything is owned', () => {
    expect(shoppingList(dishes, pantry, pantry)).toEqual([])
  })
})
