import { describe, it, expect } from 'vitest'
import { searchDishes } from './search.js'

const labelFor = (i) =>
  ({ miso: 'White miso', maple: 'Maple syrup', honey: 'Honey', sriracha: 'Sriracha' })[i] ?? i

const dishes = [
  {
    id: 'a',
    name: 'Miso–Maple Glaze',
    lane: 'Umami',
    ingredients: [{ item: 'miso' }, { item: 'maple' }],
  },
  {
    id: 'b',
    name: 'Honey Sriracha',
    lane: 'Spicy',
    ingredients: [{ item: 'honey' }, { item: 'sriracha' }],
  },
]

describe('searchDishes', () => {
  it('returns everything for an empty query', () => {
    expect(searchDishes(dishes, '', labelFor)).toHaveLength(2)
    expect(searchDishes(dishes, '   ', labelFor)).toHaveLength(2)
  })

  it('matches by dish name', () => {
    expect(searchDishes(dishes, 'glaze', labelFor).map((d) => d.id)).toEqual(['a'])
  })

  it('matches by lane', () => {
    expect(searchDishes(dishes, 'spicy', labelFor).map((d) => d.id)).toEqual(['b'])
  })

  it('matches by ingredient id or human label, case- and space-insensitive', () => {
    expect(searchDishes(dishes, 'miso', labelFor).map((d) => d.id)).toEqual(['a'])
    expect(searchDishes(dishes, '  MAPLE ', labelFor).map((d) => d.id)).toEqual(['a']) // label "Maple syrup"
  })
})
