import { describe, it, expect } from 'vitest'
import { filterDishes } from './filters.js'

const dishes = [
  { id: 'a', lane: 'sweet', ingredients: [{ item: 'honey' }] },
  { id: 'b', lane: 'spicy', ingredients: [{ item: 'gochujang' }] },
  { id: 'c', lane: 'sweet', ingredients: [{ item: 'mirin' }] },
]
const pantry = ['honey', 'gochujang', 'mirin']

describe('lane filtering', () => {
  it('keeps only dishes in the selected lane', () => {
    const ids = filterDishes(dishes, { lane: 'sweet', pantry, owned: pantry }).map((d) => d.id)
    expect(ids).toEqual(['a', 'c'])
  })

  it("returns every dish when the lane is 'all'", () => {
    const ids = filterDishes(dishes, { lane: 'all', pantry, owned: pantry }).map((d) => d.id)
    expect(ids).toEqual(['a', 'b', 'c'])
  })

  it('hides locked (unmakeable) dishes when hideLocked is on', () => {
    const owned = ['honey', 'mirin'] // out of gochujang → dish b is locked
    const ids = filterDishes(dishes, { hideLocked: true, owned, pantry }).map((d) => d.id)
    expect(ids).toEqual(['a', 'c'])
  })

  it('keeps locked dishes visible when hideLocked is off', () => {
    const owned = ['honey', 'mirin']
    const ids = filterDishes(dishes, { hideLocked: false, owned, pantry }).map((d) => d.id)
    expect(ids).toEqual(['a', 'b', 'c'])
  })
})
